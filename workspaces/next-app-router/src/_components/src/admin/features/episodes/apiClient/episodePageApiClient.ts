import { inject } from 'regexparam';

import type { DeleteEpisodePageRequestParams } from '@/schema/src/api/episodePages/DeleteEpisodePageRequestParams';
import type { DeleteEpisodePageResponse } from '@/schema/src/api/episodePages/DeleteEpisodePageResponse';
import type { GetEpisodePageListRequestQuery } from '@/schema/src/api/episodePages/GetEpisodePageListRequestQuery';
import type { GetEpisodePageListResponse } from '@/schema/src/api/episodePages/GetEpisodePageListResponse';
import type { GetEpisodePageRequestParams } from '@/schema/src/api/episodePages/GetEpisodePageRequestParams';
import type { GetEpisodePageResponse } from '@/schema/src/api/episodePages/GetEpisodePageResponse';
import type { PatchEpisodePageRequestBody } from '@/schema/src/api/episodePages/PatchEpisodePageRequestBody';
import type { PatchEpisodePageRequestParams } from '@/schema/src/api/episodePages/PatchEpisodePageRequestParams';
import type { PatchEpisodePageResponse } from '@/schema/src/api/episodePages/PatchEpisodePageResponse';
import type { PostEpisodePageRequestBody } from '@/schema/src/api/episodePages/PostEpisodePageRequestBody';
import type { PostEpisodePageResponse } from '@/schema/src/api/episodePages/PostEpisodePageResponse';

import type { DomainSpecificApiClientInterface } from '../../../lib/api/DomainSpecificApiClientInterface';
import { apiClient } from '../../../lib/api/apiClient';

type EpisodePageApiClient = DomainSpecificApiClientInterface<{
  delete: [{ params: DeleteEpisodePageRequestParams }, DeleteEpisodePageResponse];
  fetch: [{ params: GetEpisodePageRequestParams }, GetEpisodePageResponse];
  fetchList: [{ query: GetEpisodePageListRequestQuery }, GetEpisodePageListResponse];
  post: [{ body: PostEpisodePageRequestBody }, PostEpisodePageResponse];
  update: [{ body: PatchEpisodePageRequestBody; params: PatchEpisodePageRequestParams }, PatchEpisodePageResponse];
}>;

export const episodePageApiClient: EpisodePageApiClient = {
  delete: async ({ params }) => {
    const response = await apiClient
      .delete<DeleteEpisodePageResponse>(inject('api/v1/episodePages/:episodePageId', params));
    return response.data;
  },
  delete$$key: (options) => [
    {
      method: 'delete',
      requestUrl: '/api/v1/episodePages/:episodePageId',
    },
    options,
  ],
  fetch: async ({ params }) => {
    const response = await apiClient.get<GetEpisodePageResponse>(inject('api/v1/episodePages/:episodePageId', params));
    return response.data;
  },
  fetch$$key: (options) => [
    {
      method: 'get',
      requestUrl: '/api/v1/episodePages/:episodePageId',
    },
    options,
  ],
  fetchList: async ({ query }) => {
    const response = await apiClient
      .get<GetEpisodePageListResponse>(inject('api/v1/episodePages', {}), { searchParams: query })
    return response.data;
  },
  fetchList$$key: (options) => [
    {
      method: 'get',
      requestUrl: '/api/v1/episodePages',
    },
    options,
  ],
  post: async ({ body }) => {
    const response = await apiClient
      .post<PostEpisodePageResponse>(inject('api/v1/episodePages', {}),body );
    return response.data;
  },
  post$$key: (options) => [
    {
      method: 'post',
      requestUrl: '/api/v1/episodePages',
    },
    options,
  ],
  update: async ({ body, params }) => {
    const response = await apiClient
      .patch<PatchEpisodePageResponse>(inject('api/v1/episodePages/:episodePageId', params),  body );
    return response.data;
  },
  update$$key: (options) => [
    {
      method: 'patch',
      requestUrl: '/api/v1/episodePages/:episodePageId',
    },
    options,
  ],
};
