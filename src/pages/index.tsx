import { GetStaticProps } from 'next';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Head from 'next/head';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): ReactNode {
  const { results, next_page } = postsPagination;
  const [hasNextPage, setHasNextPage] = useState(next_page);
  const [posts, setPosts] = useState(results);

  useEffect(() => {
    const FormattedPosts = results.map(post => {
      return {
        ...post,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
      };
    });

    setPosts(FormattedPosts);
  }, []);

  async function handleLoadMorePosts(): Promise<void> {
    const response = await fetch(next_page).then(res => res.json());

    setHasNextPage(response.next_page);
    if (response.results) {
      const newPosts = response.results.map(post => {
        return {
          uid: post.uid,
          first_publication_date: format(
            new Date(post.first_publication_date),
            'dd MMM yyyy',
            {
              locale: ptBR,
            }
          ),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        };
      });
      setPosts([...posts, ...newPosts]);
    }
  }

  return (
    <>
      <Head>
        <title>spacetraveling | home</title>
      </Head>
      <Header />

      <div className={`${commonStyles.content} ${styles.postsConmtainer}`}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a className={styles.post}>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div>
                <div className={styles.info}>
                  <FiCalendar />
                  {post.first_publication_date}
                </div>
                <div className={styles.info}>
                  <FiUser />
                  {post.data.author}
                </div>
              </div>
            </a>
          </Link>
        ))}
        {hasNextPage && (
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={handleLoadMorePosts}
          >
            Carregar mais posts
          </button>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const posts: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
