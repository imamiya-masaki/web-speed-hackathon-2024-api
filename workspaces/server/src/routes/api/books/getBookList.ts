import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

import { GetBookListRequestQuerySchema } from '@wsh-2024/schema/src/api/books/GetBookListRequestQuery';
import { GetBookListResponseSchema } from '@wsh-2024/schema/src/api/books/GetBookListResponse';

import { bookRepository } from '../../../repositories';


const zenkakuMap: Record<string, string> = {
  'ガ': 'ｶﾞ', 'ギ': 'ｷﾞ', 'グ': 'ｸﾞ', 'ゲ': 'ｹﾞ', 'ゴ': 'ｺﾞ',
  'ザ': 'ｻﾞ', 'ジ': 'ｼﾞ', 'ズ': 'ｽﾞ', 'ゼ': 'ｾﾞ', 'ゾ': 'ｿﾞ',
  'ダ': 'ﾀﾞ', 'ヂ': 'ﾁﾞ', 'ヅ': 'ﾂﾞ', 'デ': 'ﾃﾞ', 'ド': 'ﾄﾞ',
  'バ': 'ﾊﾞ', 'ビ': 'ﾋﾞ', 'ブ': 'ﾌﾞ', 'ベ': 'ﾍﾞ', 'ボ': 'ﾎﾞ',
  'パ': 'ﾊﾟ', 'ピ': 'ﾋﾟ', 'プ': 'ﾌﾟ', 'ペ': 'ﾍﾟ', 'ポ': 'ﾎﾟ',
  'ヴ': 'ｳﾞ', 'ヷ': 'ﾜﾞ', 'ヺ': 'ｦﾞ',
  'ア': 'ｱ', 'イ': 'ｲ', 'ウ': 'ｳ', 'エ': 'ｴ', 'オ': 'ｵ',
  'カ': 'ｶ', 'キ': 'ｷ', 'ク': 'ｸ', 'ケ': 'ｹ', 'コ': 'ｺ',
  'サ': 'ｻ', 'シ': 'ｼ', 'ス': 'ｽ', 'セ': 'ｾ', 'ソ': 'ｿ',
  'タ': 'ﾀ', 'チ': 'ﾁ', 'ツ': 'ﾂ', 'テ': 'ﾃ', 'ト': 'ﾄ',
  'ナ': 'ﾅ', 'ニ': 'ﾆ', 'ヌ': 'ﾇ', 'ネ': 'ﾈ', 'ノ': 'ﾉ',
  'ハ': 'ﾊ', 'ヒ': 'ﾋ', 'フ': 'ﾌ', 'ヘ': 'ﾍ', 'ホ': 'ﾎ',
  'マ': 'ﾏ', 'ミ': 'ﾐ', 'ム': 'ﾑ', 'メ': 'ﾒ', 'モ': 'ﾓ',
  'ヤ': 'ﾔ', 'ユ': 'ﾕ', 'ヨ': 'ﾖ',
  'ラ': 'ﾗ', 'リ': 'ﾘ', 'ル': 'ﾙ', 'レ': 'ﾚ', 'ロ': 'ﾛ',
  'ワ': 'ﾜ', 'ヲ': 'ｦ', 'ン': 'ﾝ',
  'ー': 'ｰ', '。': '｡', '、': '､', '「': '｢', '」': '｣'
};
const hankakuMap = (function(){
  const obj: Record<string, string> = {}
  for (const [key,value] of Object.entries(zenkakuMap)) {
    obj[value] = key
  }
  return obj
})()
function toHankaku(str: string) {

  return str.split('').map((char: string) => zenkakuMap[char] || char).join('');
}

function toZenkaku(str: string) {

  return str.split('').map((char: string) => hankakuMap[char] || char).join('');
}

function toHiragana(str: string) {
  return str.replace(/[\u30a1-\u30f6]/g, match =>
      String.fromCharCode(match.charCodeAt(0) - 0x60)
  );
}

function toKatakana(str: string) {
  return str.replace(/[\u3041-\u3096]/g, match =>
      String.fromCharCode(match.charCodeAt(0) + 0x60)
  );
}

const app = new OpenAPIHono();

const route = createRoute({
  method: 'get',
  path: '/api/v1/books',
  request: {
    query: GetBookListRequestQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GetBookListResponseSchema,
        },
      },
      description: 'Get book list.',
    },
  },
  tags: ['[App] Books API'],
});

app.openapi(route, async (c) => {
  const query = c.req.valid('query');
  const keyword = query.keyword ?? '';
  const obj = {
    zenhira: toZenkaku(toHiragana(keyword)),
    hanhira: toHankaku(toHiragana(keyword)),
    zenkata: toZenkaku(toKatakana(keyword)),
    hankata: toHankaku(toKatakana(keyword))
  }
  console.log('query, s', query, query.keyword, obj)
  const res = await bookRepository.readAll({ query: {...query, ...obj} });
  // console.log('res', res)
  if (res.isErr()) {
    throw res.error;
  }
  return c.json(res.value);
});

export { app as getBookListApp };

