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
import fi from 'date-fns/esm/locale/fi/index.js';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { Comments } from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({ post }: PostProps): ReactElement {
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
        <img src={post.data.banner.url} alt={post.data.title} />
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
        <Comments />
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
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
      post,
    },
    revalidate: 5, // 1 hour
  };
};
