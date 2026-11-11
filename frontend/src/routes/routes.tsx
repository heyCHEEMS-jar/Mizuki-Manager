import React, { lazy, Suspense } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLoading } from '../components/Page'
const Login = lazy(() => import('../pages/login'))
const Index = lazy(() => import('../pages/index'))
const About = lazy(() => import('../pages/about'))
const Album = lazy(() => import('../pages/album'))
const Anime = lazy(() => import('../pages/anime'))
const Builder = lazy(() => import('../pages/builder'))
const Config = lazy(() => import('../pages/config'))
const Device = lazy(() => import('../pages/device'))
const Diary = lazy(() => import('../pages/diary'))
const Friend = lazy(() => import('../pages/friend'))
const Project = lazy(() => import('../pages/project'))
const Skill = lazy(() => import('../pages/skill'))
const Timeline = lazy(() => import('../pages/timeline'))
const Music = lazy(() => import('../pages/music'))
const Post = lazy(() => import('../pages/post'))

const NotFound = () => {
  const { t } = useTranslation()
  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 p-6 text-center">
      <div>
        <div className="text-7xl font-bold tracking-tight text-primary">404</div>
        <h1 className="mt-4 text-xl font-semibold">{t('app.notFound')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('app.notFoundDescription')}</p>
        <Link
          to="/index"
          className="mt-6 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:brightness-95"
        >
          {t('app.backHome')}
        </Link>
      </div>
    </div>
  )
}

const lazyLoad = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<PageLoading />}>
    <Component />
  </Suspense>
)

export interface RouteItem {
  path: string
  element: React.ReactNode
  children?: RouteItem[]
  needAuth?: boolean
}

const routes: RouteItem[] = [
  {
    path: '/',
    element: <Navigate to="/index" replace />
  },
  {
    path: '/login',
    element: lazyLoad(Login)
  },
  {
    path: '/index',
    element: lazyLoad(Index),
    needAuth: true
  },
  {
    path: '/about',
    element: lazyLoad(About),
    needAuth: true
  },
  {
    path: '/album',
    element: lazyLoad(Album),
    needAuth: true
  },
  {
    path: '/anime',
    element: lazyLoad(Anime),
    needAuth: true
  },
  {
    path: '/builder',
    element: lazyLoad(Builder),
    needAuth: true
  },
  {
    path: '/config',
    element: lazyLoad(Config),
    needAuth: true
  },
  {
    path: '/device',
    element: lazyLoad(Device),
    needAuth: true
  },
  {
    path: '/diary',
    element: lazyLoad(Diary),
    needAuth: true
  },
  {
    path: '/friend',
    element: lazyLoad(Friend),
    needAuth: true
  },
  {
    path: '/project',
    element: lazyLoad(Project),
    needAuth: true
  },
  {
    path: '/skill',
    element: lazyLoad(Skill),
    needAuth: true
  },
  {
    path: '/timeline',
    element: lazyLoad(Timeline),
    needAuth: true
  },
  {
    path: '/music',
    element: lazyLoad(Music),
    needAuth: true
  },
  {
    path: '/post/*',
    element: lazyLoad(Post),
    needAuth: true
  },
  {
    path: '*',
    element: <NotFound />
  }
]

export const routePaths = [...routes.filter(route => route.needAuth && !route.path.endsWith('/*')).map(route => route.path), '/post']

export default routes
