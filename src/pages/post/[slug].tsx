import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';

import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';

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

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const totalWords = post.data.content.reduce((acc, cur) => {
    if (cur.heading) {
      acc += cur.heading.split(' ').length;
      const words = cur.body.map(item => item.text.split(' ').length);
      words.map(word => (acc += word));
      return acc;
    } else {
      const words = cur.body.map(item => item.text.split(' ').length);
      words.map(word => (acc += word));
      return acc;
    }
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  return (
    <div className={commonStyles.container}>
      <Header />
      <main className={styles.container}>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt={post.data.title} />
        </div>
        <article>
          <h1>{post.data.title}</h1>
          <div className={styles.articleInfo}>
            <span>
              <FiCalendar />
              <time>
                {format(new Date(post.first_publication_date), 'dd MMM yyy', {
                  locale: ptBR,
                })}
              </time>
            </span>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />
              {`${readTime} min`}
            </span>
          </div>
          <div className={styles.content}>
            {post.data.content.map(c => {
              return (
                <div key={c.heading}>
                  <h2>{c.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(c.body),
                    }}
                  ></div>
                </div>
              );
            })}
          </div>
        </article>
      </main>
    </div>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'post',
    String(context.params.slug),
    {}
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
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
  };
};
