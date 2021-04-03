/* eslint-disable no-shadow */
import { GetStaticPaths, GetStaticProps } from 'next';
import { ReactElement, useMemo } from 'react';
import Prismic from '@prismicio/client';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { Comments } from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: Post | null;
  prevPost: Post | null;
}

export default function Post({
  post,
  preview,
  nextPost,
  prevPost,
}: PostProps): ReactElement {
  const router = useRouter();

  const readTime = useMemo(() => {
    const wordsPerMinute = 200;
    let fullText = '';

    post.data.content.forEach(content => {
      fullText += content.heading;
      fullText += RichText.asText(content.body);
    });

    return Math.ceil(fullText.split(' ').length / wordsPerMinute);
  }, [post]);

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <Head>
        <title>spacetraveling | {post.data.title}</title>
      </Head>
      <Header />
      <header className={styles.banner}>
        <img src={post.data.banner?.url ?? ''} alt={post.data.title} />
      </header>
      <div className={`${commonStyles.content} ${styles.postContainer}`}>
        <h1>{post.data.title}</h1>
        <div className={styles.infoContainer}>
          <div className={styles.info}>
            <FiCalendar />
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </div>
          <div className={styles.info}>
            <FiUser />
            {post.data.author}
          </div>
          <div className={styles.info}>
            <FiClock />
            {readTime} min
          </div>
        </div>
        {post.last_publication_date && (
          <span className={styles.edittedTime}>
            {'* editado em '}
            <time>
              {format(new Date(post.last_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
              {' às '}
              {format(new Date(post.last_publication_date), 'HH:mm', {
                locale: ptBR,
              })}
            </time>
          </span>
        )}
        <main className={styles.post}>
          {post.data.content.map(section => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(section.body),
                }}
              />
            </section>
          ))}
        </main>
        <footer className={styles.footer}>
          <div>
            {prevPost && (
              <Link href={`/post/${prevPost.uid}`}>
                <a>
                  <h4>{prevPost.data.title}</h4>
                  <span>Post anterior</span>
                </a>
              </Link>
            )}
          </div>
          <div>
            {nextPost && (
              <Link href={`/post/${nextPost.uid}`}>
                <a>
                  <h4>{nextPost.data.title}</h4>
                  <span>Próximo Post</span>
                </a>
              </Link>
            )}
          </div>
        </footer>
        <Comments />
        {preview && (
          <aside className={commonStyles.exitPreviewButton}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date]',
      after: response.id,
    }
  );

  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
      after: response.id,
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url ?? '',
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      preview,
      nextPost: nextPost.results[0] ?? null,
      prevPost: prevPost.results[0] ?? null,
      post,
    },
    revalidate: 5, // 1 hour
  };
};
