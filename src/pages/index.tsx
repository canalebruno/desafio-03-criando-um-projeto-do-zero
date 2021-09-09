import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';

import Link from 'next/link';

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

export default function Home(props: HomeProps) {
  const { results, next_page } = props.postsPagination;

  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  function handleLoadMorePosts() {
    fetch(nextPage)
      .then(res => res.json())
      .then(body => {
        const results = body.results.map(post => {
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
        const newPosts = [...posts, ...results];
        setPosts(newPosts);
        setNextPage(body.next_page);
      });
  }

  return (
    <div className={commonStyles.container}>
      <main className={styles.container}>
        <img src="/logo.svg" alt="logo" />
        <div className={styles.postsContainer}>
          {posts.map(post => {
            return (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <div className={styles.post}>
                  <a>
                    <h2>{post.data.title}</h2>
                    <p>{post.data.subtitle}</p>
                  </a>
                  <div className={styles.articleInfo}>
                    <span>
                      <FiCalendar />
                      <time>
                        {format(
                          new Date(post.first_publication_date),
                          'dd MMM yyy',
                          { locale: ptBR }
                        )}
                      </time>
                    </span>
                    <span>
                      <FiUser />
                      {post.data.author}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {nextPage && (
          <button onClick={handleLoadMorePosts}>Carregar mais posts</button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
    }
  );

  const results = postsResponse.results.map(post => {
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

  const postsPagination = {
    next_page: postsResponse.next_page,
    results,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
