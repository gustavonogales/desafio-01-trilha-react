/* eslint-disable consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';
import { Document } from '@prismicio/client/types/documents';
import { getPrismicClient } from '../../services/prismic';

function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

export default async (
  request: NextApiRequest,
  response: NextApiResponse
): Promise<void> => {
  const prismic = getPrismicClient(request);

  const { token: ref, documentId } = request.query;

  const redirectUrl = await prismic
    .getPreviewResolver(String(ref), String(documentId))
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return response.status(401).json({ message: 'Invalid token' });
  }

  response.setPreviewData({ ref });
  response.writeHead(302, { Location: `${redirectUrl}` });
  response.end();
};
