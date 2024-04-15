import { inject } from 'regexparam';

import type { PostImageRequestBody } from '@/schema/src/api/images/PostImageRequestBody';
import type { PostImageResponse } from '@/schema/src/api/images/PostImageResponse';

import type { DomainSpecificApiClientInterface } from '../../../lib/api/DomainSpecificApiClientInterface';
import { apiClient } from '../../../lib/api/apiClient';

export type ImageApiClient = DomainSpecificApiClientInterface<{
  post: [{ body: PostImageRequestBody }, PostImageResponse];
}>;

export const imageApiClient: ImageApiClient = {
  post: async ({ body }) => {
    const formData = new FormData();
        // @ts-ignore
    formData.append('alt', body.alt);
    formData.append('content', body.content);

    const response = await apiClient
      .post<PostImageResponse>(inject('api/v1/images', {}), 
        formData,
      );
    return response.data;
  },
  post$$key: (options) => [
    {
      method: 'post',
      requestUrl: `/api/v1/images`,
    },
    options,
  ],
};
