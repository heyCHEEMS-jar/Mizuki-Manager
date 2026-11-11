import {
  BookOpen,
  Info,
  CirclePlay,
  FileText,
  FolderKanban,
  Headphones,
  History,
  House,
  Image,
  Network,
  Rocket,
  Settings,
  Users,
  Volume2,
  type LucideIcon
} from 'lucide-react'

export interface ManagerItem {
  title: string
  subtitle: string
  icon: LucideIcon
  path: string
  hideFromHome?: boolean
}

export const managerList: ManagerItem[] = [
  { title: '首页', subtitle: 'Home', icon: House, path: '/index', hideFromHome: true },
  { title: '关于', subtitle: 'About', icon: Info, path: '/about' },
  { title: '相册', subtitle: 'Album', icon: Image, path: '/album' },
  { title: '追番', subtitle: 'Anime', icon: CirclePlay, path: '/anime' },
  { title: '构建部署', subtitle: 'Build', icon: Rocket, path: '/builder' },
  { title: '配置', subtitle: 'Config', icon: Settings, path: '/config' },
  { title: '我的设备', subtitle: 'Device', icon: Network, path: '/device' },
  { title: '日记', subtitle: 'Diary', icon: BookOpen, path: '/diary' },
  { title: '友链', subtitle: 'Friend', icon: Users, path: '/friend' },
  { title: '音乐播放器', subtitle: 'Music', icon: Volume2, path: '/music' },
  { title: '文章', subtitle: 'Post', icon: FileText, path: '/post' },
  { title: '项目展示', subtitle: 'Project', icon: FolderKanban, path: '/project' },
  { title: '技能展示', subtitle: 'Skill', icon: Headphones, path: '/skill' },
  { title: '时间线', subtitle: 'Timeline', icon: History, path: '/timeline' }
]
