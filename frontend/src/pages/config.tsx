import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Copy, LoaderCircle, Pencil, Plus, RefreshCw, Save, Trash2, Upload as UploadIcon } from 'lucide-react'
import { Page, PageHeader, PageSection } from '../components/Page'
import {
  Form,
  FormField,
  useForm,
  useFormWatch,
  Input,
  NumberInput,
  Switch,
  Select,
  Button,
  Accordion,
  Divider,
  Empty,
  Dialog,
  Badge,
  type AccordionProps,
  Image,
  Textarea,
  Upload,
  ConfirmDialog
} from '../components/ui'
import { getConfigData, uploadAvatarImage, uploadHomeImage, uploadMobileWallpapers, uploadPCWallpapers, writeConfigData } from '../services/config'
import { debounce, deepMerge, throttle, unwrap, wrap } from '../utils/util'
import { useConfigContentDB } from '../hooks/useConfigContentDB'
import { imageAccept } from '../configs/upload-config'
import { Icon } from '@iconify/react'
import { notify } from '../lib/notify'
import { cn } from '../lib/utils'

interface EditableListProps {
  value?: any[]
  onChange?: (value: any[]) => void
  itemRender?: (item: any, index: number, onEdit: () => void, onDelete: () => void) => React.ReactNode
  addButtonText?: string
  emptyText?: string
  dialogTitle?: string
  dialogFields?: (form: any, iconValue: string) => React.ReactNode
}

// 默认值
const defaultValues = {
  SITE_LANG: 'zh_CN',
  SITE_TIMEZONE: 8,
  siteConfig: {
    title: '',
    subtitle: '',
    siteURL: '',
    siteStartDate: '2026-01-01',
    themeColor: { hue: 240, fixed: false },
    featurePages: {
      anime: true,
      diary: true,
      friends: true,
      projects: true,
      skills: true,
      timeline: true,
      albums: true,
      devices: true
    },
    navbarTitle: {
      mode: 'logo',
      text: '',
      icon: '',
      logo: ''
    },
    showLastModified: true,
    generateOgImages: false,
    banner: {
      src: {
        desktop: [],
        mobile: []
      },
      position: 'center',
      carousel: {
        enable: true,
        interval: 3
      },
      waves: {
        enable: true,
        performanceMode: false,
        mobileDisable: false
      },
      imageApi: {
        enable: false,
        url: ''
      },
      homeText: {
        enable: true,
        title: '',
        subtitle: [],
        typewriter: {
          enable: true,
          speed: 100,
          deleteSpeed: 50,
          pauseTime: 2000
        }
      },
      credit: {
        enable: false,
        text: '',
        url: ''
      },
      navbar: {
        transparentMode: 'semifull'
      }
    }
  },
  fullscreenWallpaperConfig: {
    position: 'center',
    opacity: 0.8,
    blur: 1,
    zIndex: -1,
    src: {
      desktop: [],
      mobile: []
    },
    carousel: { enable: true, interval: 5 }
  },
  navBarConfig: {
    links: [
      {
        children: [
          {
            name: '',
            url: '',
            external: true,
            icon: ''
          },
          {
            name: '',
            url: '',
            external: true,
            icon: ''
          },
          {
            name: 'Gitee',
            url: '',
            external: true,
            icon: ''
          }
        ]
      }
    ]
  },
  profileConfig: {
    avatar: '',
    name: '',
    bio: '',
    typewriter: { enable: true, speed: 80 },
    links: []
  },
  musicPlayerConfig: {
    enable: true,
    showFloatingPlayer: true,
    floatingEntryMode: 'fab',
    mode: 'local',
    meting_api: 'https://meting.mysqil.com/api?server=:server&type=:type&id=:id&auth=:auth&r=:r',
    id: '114514',
    server: 'netease',
    type: 'playlist'
  },
  commentConfig: {
    enable: false,
    system: 'twikoo',
    twikoo: { envId: 'https://twikoo.vercel.app', lang: 'zh_CN' },
    giscus: {
      repo: 'your-github-username/your-repo-name',
      repoId: 'your-repo-id',
      category: 'Announcements',
      categoryId: 'your-category-id',
      mapping: 'pathname',
      strict: '0',
      reactionsEnabled: '1',
      emitMetadata: '0',
      inputPosition: 'top',
      theme: 'preferred_color_scheme',
      lang: 'zh_CN',
      loading: 'lazy'
    }
  },
  sakuraConfig: {
    enable: true,
    sakuraNum: 8,
    limitTimes: -1,
    size: { min: 0.5, max: 1.1 },
    opacity: { min: 0.3, max: 0.9 },
    speed: { horizontal: { min: -1.7, max: -1.2 }, vertical: { min: 1.5, max: 2.2 }, rotation: 0.03, fadeSpeed: 0.03 },
    zIndex: 1
  },
  pioConfig: {
    enable: true,
    position: 'left',
    hiddenOnMobile: true,
    width: 280,
    height: 250,
    mode: 'draggable',
    dialog: { welcome: '', home: '', close: '', link: '', touch: [], skin: [] }
  },
  licenseConfig: {
    enable: true,
    name: '',
    url: ''
  },
  announcementConfig: {
    title: '',
    content: '',
    closable: true,
    link: { enable: true, text: '', url: '', external: false }
  },
  shareConfig: { enable: true },
  relatedPostsConfig: { enable: true, maxCount: 5 },
  randomPostsConfig: { enable: true, maxCount: 5 }
}

const featurePages = [
  { name: '番剧', key: 'anime' },
  { name: '日记', key: 'diary' },
  { name: '友链', key: 'friends' },
  { name: '项目', key: 'projects' },
  { name: '技能', key: 'skills' },
  { name: '时间线', key: 'timeline' },
  { name: '相册', key: 'albums' },
  { name: '设备', key: 'devices' }
]

const CopyText = ({ value, className }: { value: string; className?: string }) => (
  <button
    type="button"
    className={cn('inline-flex min-w-0 items-center gap-1 text-left text-sm hover:text-primary', className)}
    title={value}
    onClick={() =>
      navigator.clipboard
        .writeText(value)
        .then(() => notify.success('已复制到剪切板'))
        .catch(() => notify.error('复制失败'))
    }
  >
    <span className="truncate">{value}</span>
    <Copy className="size-3 shrink-0" />
  </button>
)

const CustomList: React.FC<{
  dataSource: any[]
  renderItem: (item: any, index: number) => React.ReactNode
}> = ({ dataSource, renderItem }) => (
  <div className="space-y-1">
    {dataSource.map((item, index) => (
      <div key={index}>{renderItem(item, index)}</div>
    ))}
  </div>
)

const EditableList: React.FC<EditableListProps> = ({
  value = [],
  onChange,
  itemRender,
  addButtonText = '添加',
  emptyText = '暂无数据',
  dialogTitle = '编辑项',
  dialogFields
}) => {
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const form = useForm()

  const iconValue = useFormWatch('icon', form)

  const handleAdd = () => {
    setEditingIndex(null)
    form.reset()
    form.setValues({ name: '', icon: '', url: '' })
    setDialogVisible(true)
  }
  const handleEdit = (index: number) => {
    setEditingIndex(index)
    form.setValues(value[index])
    setDialogVisible(true)
  }
  const handleDelete = (index: number) => {
    const newList = [...value]
    newList.splice(index, 1)
    onChange?.(newList)
  }
  const handleDialogSave = async () => {
    try {
      const values = await form.validate()
      const newList = [...value]
      if (editingIndex === null) {
        newList.push(values)
      } else {
        newList[editingIndex] = values
      }
      onChange?.(newList)
      setDialogVisible(false)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      {!value.length ? (
        <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <CustomList
          dataSource={value}
          renderItem={(item, idx) => (
            <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
              <div className="min-w-0 flex-1">
                {itemRender ? (
                  itemRender(
                    item,
                    idx,
                    () => handleEdit(idx),
                    () => handleDelete(idx)
                  )
                ) : (
                  <span className="block truncate text-sm" title={JSON.stringify(item)}>
                    {JSON.stringify(item)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="small"
                  className="size-8 px-0"
                  icon={<Pencil className="size-4" />}
                  aria-label="编辑"
                  onClick={() => handleEdit(idx)}
                />
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="small"
                      className="size-8 px-0 text-destructive hover:bg-destructive/10"
                      icon={<Trash2 className="size-4" />}
                      aria-label="删除"
                    />
                  }
                  title="删除此项？"
                  confirmLabel="删除"
                  variant="destructive"
                  onConfirm={() => handleDelete(idx)}
                />
              </div>
            </div>
          )}
        />
      )}
      <Button variant="outline" block icon={<Plus className="size-4" />} onClick={handleAdd} className="mt-2 border-dashed">
        {addButtonText}
      </Button>
      <Dialog
        closeOnOutside={false}
        title={dialogTitle}
        open={dialogVisible}
        onSubmit={handleDialogSave}
        onCancel={() => setDialogVisible(false)}
        width={600}
      >
        <Form form={form}>{dialogFields?.(form, iconValue)}</Form>
      </Dialog>
    </>
  )
}

const StringListEditor: React.FC<{
  value?: string[]
  onChange?: (val: string[]) => void
  addText?: string
  imageMode?: boolean
  uploadImage?: (file: File, fileList: File[], onSuccess?: (urls: string[]) => void) => Promise<boolean>
}> = ({ value = [], onChange, addText = '添加', imageMode = false, uploadImage = async () => false }) => {
  const [inputVal, setInputVal] = useState('')

  const addItem = () => {
    const val = inputVal.trim()
    if (val) {
      onChange?.([...value, val])
      setInputVal('')
    }
  }
  const removeItem = (index: number) => {
    const newList = [...value]
    newList.splice(index, 1)
    onChange?.(newList)
  }
  const uploadItem = (urls: string[]) => {
    onChange?.([...value, ...urls.filter(url => url.trim())])
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-3">
        {value.map((item, index) => (
          <div key={`${item}-${index}`} className="flex max-w-full items-center gap-2 rounded-lg border bg-muted/20 p-2">
            {imageMode && <Image loading="lazy" width={70} height={70} className="rounded object-contain" src={item} alt={item} />}
            <span className="max-w-44 truncate text-sm" title={item}>
              {item}
            </span>
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="移除"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Input value={inputVal} onChange={event => setInputVal(event.target.value)} placeholder="输入内容后添加" />
        {imageMode && (
          <Upload accept={imageAccept} beforeUpload={(file, fileList) => uploadImage(file, fileList, uploadItem)} multiple>
            <Button className="w-full sm:w-auto" icon={<UploadIcon className="size-4" />}>
              上传
            </Button>
          </Upload>
        )}
        <Button className="w-full sm:w-auto" icon={<Plus className="size-4" />} onClick={addItem}>
          {addText}
        </Button>
      </div>
    </>
  )
}

const settingsSections = (
  uploadHomeImg: (file: File, fileList: File[], onSuccess?: (url: string) => void) => Promise<boolean>,
  uploadAvatar: (file: File, fileList: File[], onSuccess?: (url: string) => void) => Promise<boolean>,
  uploadPCWallpaperImages: (file: File, fileList: File[], onSuccess?: (urls: string[]) => void) => Promise<boolean>,
  uploadMobileWallpaperImages: (file: File, fileList: File[], onSuccess?: (urls: string[]) => void) => Promise<boolean>
): AccordionProps['items'] => [
  // 基础配置
  {
    key: 'basic',
    label: '基础配置',

    children: (
      <div className="grid gap-x-4 md:grid-cols-12">
        <div className="md:col-span-6">
          <FormField name="SITE_LANG" label="站点语言">
            <Select
              options={[
                { label: '简体中文', value: 'zh_CN' },
                { label: 'English', value: 'en' },
                { label: '日本語', value: 'ja' }
              ]}
            />
          </FormField>
        </div>
        <div className="md:col-span-6">
          <FormField name="SITE_TIMEZONE" label="时区偏移(-12~12, 例如中国为+8)">
            <NumberInput min={-12} max={12} className="w-full" />
          </FormField>
        </div>
      </div>
    )
  },
  // 站点外观
  {
    key: 'site',
    label: '站点外观',

    children: (
      <>
        <div className="grid gap-x-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <FormField name={['siteConfig', 'title']} label="站点标题">
              <Input />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['siteConfig', 'subtitle']} label="副标题">
              <Input />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['siteConfig', 'siteStartDate']} label="建站日期">
              <Input placeholder="2026-01-01" />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['siteConfig', 'themeColor', 'hue']} label="主题色色相">
              <NumberInput min={0} max={360} className="w-full" />
            </FormField>
          </div>
          <div className="md:col-span-12">
            <FormField name={['siteConfig', 'siteURL']} label="站点URL">
              <Input />
            </FormField>
          </div>
          <div className="md:col-span-12">
            <FormField name={['siteConfig', 'themeColor', 'fixed']} label="固定主题色" valueKey="checked">
              <Switch />
            </FormField>
          </div>
        </div>
        <Divider orientation="horizontal">功能页面</Divider>
        <div className="grid gap-x-4 md:grid-cols-12">
          {featurePages.map(f => (
            <div className="md:col-span-3" key={f.key}>
              <FormField name={['siteConfig', 'featurePages', f.key]} label={f.name} valueKey="checked">
                <Switch />
              </FormField>
            </div>
          ))}
        </div>
        <Divider orientation="horizontal">导航栏标题</Divider>
        <div className="grid gap-x-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <FormField name={['siteConfig', 'navbarTitle', 'mode']} label="模式">
              <Select
                options={[
                  { label: '仅显示Logo', value: 'logo' },
                  { label: '显示Logo+文本', value: 'text-icon' }
                ]}
              />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['siteConfig', 'navbarTitle', 'text']} label="文字">
              <Input />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField label="图标路径" className="mb-2">
              <div className="flex w-full gap-2">
                <FormField name={['siteConfig', 'navbarTitle', 'icon']} unstyled>
                  <Input placeholder="例如: assets/home/home.png" />
                </FormField>
                <FormField unstyled observe={(prev, cur) => prev?.siteConfig?.navbarTitle?.icon !== cur?.siteConfig?.navbarTitle?.icon}>
                  {({ setValue }) => (
                    <Upload
                      accept={imageAccept}
                      beforeUpload={(file: File, fileList: File[]) => {
                        uploadHomeImg(file, fileList, url => setValue(['siteConfig', 'navbarTitle', 'icon'], url))
                      }}
                    >
                      <Button>
                        <UploadIcon className="size-4" />
                        <span>上传</span>
                      </Button>
                    </Upload>
                  )}
                </FormField>
              </div>
            </FormField>
            <FormField unstyled observe={(prev, cur) => prev?.siteConfig?.navbarTitle?.icon !== cur?.siteConfig?.navbarTitle?.icon}>
              {({ getValue }) => {
                const url = getValue(['siteConfig', 'navbarTitle', 'icon'])
                return <Image loading="lazy" width="100%" height={80} className="object-contain" src={url} alt={url} />
              }}
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField label="Logo路径" className="mb-2">
              <div className="flex w-full gap-2">
                <FormField name={['siteConfig', 'navbarTitle', 'logo']} unstyled>
                  <Input placeholder="例如: assets/home/default-logo.png" />
                </FormField>
                <FormField unstyled observe={(prev, cur) => prev?.siteConfig?.navbarTitle?.logo !== cur?.siteConfig?.navbarTitle?.logo}>
                  {({ setValue }) => (
                    <Upload
                      accept={imageAccept}
                      beforeUpload={(file: File, fileList: File[]) => {
                        uploadHomeImg(file, fileList, url => setValue(['siteConfig', 'navbarTitle', 'logo'], url))
                      }}
                    >
                      <Button>
                        <UploadIcon className="size-4" />
                        <span>上传</span>
                      </Button>
                    </Upload>
                  )}
                </FormField>
              </div>
            </FormField>
            <FormField unstyled observe={(prev, cur) => prev?.siteConfig?.navbarTitle?.logo !== cur?.siteConfig?.navbarTitle?.logo}>
              {({ getValue }) => {
                const url = getValue(['siteConfig', 'navbarTitle', 'logo'])
                return <Image loading="lazy" width="100%" height={80} className="object-contain" src={url} alt={url} />
              }}
            </FormField>
          </div>
        </div>
        <FormField name={['siteConfig', 'showLastModified']} valueKey="checked" label="显示最后修改时间">
          <Switch />
        </FormField>
        <FormField name={['siteConfig', 'generateOgImages']} valueKey="checked" label="生成OpenGraph图片">
          <Switch />
        </FormField>
      </>
    )
  },
  // 全屏壁纸
  {
    key: 'wallpaper',
    label: '全屏壁纸',

    children: (
      <div className="grid gap-x-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <FormField name={['fullscreenWallpaperConfig', 'position']} label="壁纸位置">
            <Select
              options={[
                { label: '居中', value: 'center' },
                { label: '顶部', value: 'top' },
                { label: '底部', value: 'bottom' },
                { label: '左侧', value: 'left' },
                { label: '右侧', value: 'right' }
              ]}
            />
          </FormField>
        </div>
        <div className="md:col-span-4">
          <FormField name={['fullscreenWallpaperConfig', 'opacity']} label="透明度">
            <NumberInput min={0} max={1} step={0.1} className="w-full" />
          </FormField>
        </div>
        <div className="md:col-span-4">
          <FormField name={['fullscreenWallpaperConfig', 'blur']} label="模糊度">
            <NumberInput min={0} max={10} className="w-full" />
          </FormField>
        </div>
        <div className="md:col-span-12">
          <FormField label="桌面端壁纸" name={['fullscreenWallpaperConfig', 'src', 'desktop']}>
            <StringListEditor imageMode={true} uploadImage={uploadPCWallpaperImages} />
          </FormField>
        </div>
        <div className="md:col-span-12">
          <FormField label="移动端壁纸" name={['fullscreenWallpaperConfig', 'src', 'mobile']}>
            <StringListEditor imageMode={true} uploadImage={uploadMobileWallpaperImages} />
          </FormField>
        </div>
        <div className="md:col-span-12">
          <FormField name={['fullscreenWallpaperConfig', 'carousel', 'enable']} valueKey="checked" label="轮播开关">
            <Switch />
          </FormField>
        </div>
        <div className="md:col-span-6">
          <FormField name={['fullscreenWallpaperConfig', 'carousel', 'interval']} label="轮播间隔(秒)">
            <NumberInput min={1} className="w-full" />
          </FormField>
        </div>
        <div className="md:col-span-6">
          <FormField name={['fullscreenWallpaperConfig', 'zIndex']} label="层级">
            <NumberInput className="w-full" />
          </FormField>
        </div>
      </div>
    )
  },
  // 横幅配置
  {
    key: 'banner',
    label: '横幅配置',
    children: (
      <>
        {/* 横幅图片 */}
        <FormField label="桌面端横幅" name={['siteConfig', 'banner', 'src', 'desktop']}>
          <StringListEditor imageMode={true} uploadImage={uploadPCWallpaperImages} />
        </FormField>
        <FormField label="移动端横幅" name={['siteConfig', 'banner', 'src', 'mobile']}>
          <StringListEditor imageMode={true} uploadImage={uploadMobileWallpaperImages} />
        </FormField>

        <Divider orientation="horizontal">基础设置</Divider>

        <div className="grid gap-x-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <FormField name={['siteConfig', 'banner', 'position']} label="图片位置">
              <Select
                options={[
                  { label: '居中', value: 'center' },
                  { label: '顶部', value: 'top' },
                  { label: '底部', value: 'bottom' }
                ]}
              />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['siteConfig', 'banner', 'navbar', 'transparentMode']} label="导航栏透明模式">
              <Select
                options={[
                  { label: '半透明+圆角', value: 'semi' },
                  { label: '完全透明', value: 'full' },
                  { label: '动态透明', value: 'semifull' }
                ]}
              />
            </FormField>
          </div>
        </div>

        {/* 轮播配置 */}
        <Divider orientation="horizontal">轮播配置</Divider>

        <FormField name={['siteConfig', 'banner', 'carousel', 'enable']} valueKey="checked" label="启用轮播">
          <Switch />
        </FormField>

        <FormField name={['siteConfig', 'banner', 'carousel', 'interval']} label="轮播间隔(秒)">
          <NumberInput min={1} />
        </FormField>

        {/* 水波纹效果 */}
        <Divider orientation="horizontal">水波纹效果</Divider>

        <FormField name={['siteConfig', 'banner', 'waves', 'enable']} valueKey="checked" label="启用水波纹">
          <Switch />
        </FormField>

        <div className="grid gap-x-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <FormField name={['siteConfig', 'banner', 'waves', 'performanceMode']} valueKey="checked" label="性能模式">
              <Switch />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['siteConfig', 'banner', 'waves', 'mobileDisable']} valueKey="checked" label="移动端禁用">
              <Switch />
            </FormField>
          </div>
        </div>

        {/* 图片API */}
        <Divider orientation="horizontal">图片API (PicFlow)</Divider>

        <FormField name={['siteConfig', 'banner', 'imageApi', 'enable']} valueKey="checked" label="启用图片API">
          <Switch />
        </FormField>

        <FormField name={['siteConfig', 'banner', 'imageApi', 'url']} label="API地址">
          <Input placeholder="http://domain.com/api_v2.php?format=text&count=4" />
        </FormField>

        {/* 主页文字配置 */}
        <Divider orientation="horizontal">主页文字</Divider>

        <FormField name={['siteConfig', 'banner', 'homeText', 'enable']} valueKey="checked" label="启用主页文字">
          <Switch />
        </FormField>

        <FormField name={['siteConfig', 'banner', 'homeText', 'title']} label="主标题">
          <Input placeholder="输入主标题" />
        </FormField>

        <FormField label="副标题列表" name={['siteConfig', 'banner', 'homeText', 'subtitle']}>
          <StringListEditor addText="添加" />
        </FormField>

        {/* 打字机效果 */}
        <Divider orientation="horizontal">打字机效果</Divider>

        <FormField name={['siteConfig', 'banner', 'homeText', 'typewriter', 'enable']} valueKey="checked" label="启用打字机效果">
          <Switch />
        </FormField>

        <div className="grid gap-x-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <FormField name={['siteConfig', 'banner', 'homeText', 'typewriter', 'speed']} label="打字速度(ms)">
              <NumberInput min={20} max={500} step={10} className="w-full" />
            </FormField>
          </div>
          <div className="md:col-span-4">
            <FormField name={['siteConfig', 'banner', 'homeText', 'typewriter', 'deleteSpeed']} label="删除速度(ms)">
              <NumberInput min={20} max={500} step={10} className="w-full" />
            </FormField>
          </div>
          <div className="md:col-span-4">
            <FormField name={['siteConfig', 'banner', 'homeText', 'typewriter', 'pauseTime']} label="暂停时间(ms)">
              <NumberInput min={500} max={10000} step={500} className="w-full" />
            </FormField>
          </div>
        </div>

        {/* 图片来源 */}
        <Divider orientation="horizontal">图片来源</Divider>

        <FormField name={['siteConfig', 'banner', 'credit', 'enable']} valueKey="checked" label="显示图片来源">
          <Switch />
        </FormField>

        <FormField name={['siteConfig', 'banner', 'credit', 'text']} label="来源文本">
          <Input placeholder="Describe" />
        </FormField>

        <FormField name={['siteConfig', 'banner', 'credit', 'url']} label="来源链接">
          <Input placeholder="https://..." />
        </FormField>
      </>
    )
  },
  // 导航链接配置
  {
    key: 'navbar',
    label: '导航链接',
    children: (
      <FormField name={['navBarConfig', 'links', 2, 'children']}>
        <EditableList
          addButtonText="添加导航链接"
          dialogTitle="编辑导航链接"
          dialogFields={(_, iconValue) => (
            <>
              <FormField name="name" label="名称" rules={[{ required: true }]}>
                <Input placeholder="请输入名称" />
              </FormField>
              <FormField
                name="icon"
                label={
                  <>
                    <span>图标</span>
                    <a href={process.env.ICONIFY_URL} target="_blank" rel="noreferrer">
                      &nbsp;访问 iconify
                    </a>
                  </>
                }
              >
                <Input placeholder="例如: mdi:github" suffix={iconValue ? <Icon icon={iconValue} width={20} height={20} /> : <span />} />
              </FormField>
              <FormField name="url" label="链接" rules={[{ required: true }]}>
                <Input placeholder="请输入链接" />
              </FormField>
              <FormField name="external" label="外部链接" valueKey="checked">
                <Switch />
              </FormField>
            </>
          )}
          itemRender={item => (
            <div className="flex min-w-0 items-center gap-2">
              <Badge>{item.name}</Badge>
              {item.icon && <Icon icon={item.icon} width={20} />}
              <CopyText value={item.url} className="min-w-0" />
              {item.external && <Badge>外链</Badge>}
            </div>
          )}
        />
      </FormField>
    )
  },
  // 个人资料
  {
    key: 'profile',
    label: '个人资料',
    children: (
      <>
        <FormField label="头像路径" className="mb-2">
          <div className="flex w-full gap-2">
            <FormField name={['profileConfig', 'avatar']} unstyled>
              <Input placeholder="例如: assets/images/avatar.webp" />
            </FormField>
            <FormField unstyled observe={(prev, cur) => prev?.profileConfig?.avatar !== cur?.profileConfig?.avatar}>
              {({ setValue }) => (
                <Upload
                  beforeUpload={(file: File, fileList: File[]) => {
                    uploadAvatar(file, fileList, url => setValue(['profileConfig', 'avatar'], url))
                  }}
                >
                  <Button>
                    <UploadIcon className="size-4" />
                    <span>上传</span>
                  </Button>
                </Upload>
              )}
            </FormField>
          </div>
        </FormField>
        <FormField unstyled observe={(prev, cur) => prev?.profileConfig?.avatar !== cur?.profileConfig?.avatar}>
          {({ getValue }) => {
            const url = getValue(['profileConfig', 'avatar'])
            return <Image loading="lazy" width="100%" height={80} className="object-contain" src={url} alt={url} />
          }}
        </FormField>
        <FormField name={['profileConfig', 'name']} label="昵称">
          <Input />
        </FormField>
        <FormField name={['profileConfig', 'bio']} label="简介">
          <Textarea rows={3} />
        </FormField>
        <FormField name={['profileConfig', 'typewriter', 'enable']} valueKey="checked" label="打字机效果">
          <Switch />
        </FormField>
        <FormField name={['profileConfig', 'typewriter', 'speed']} label="打字速度(ms)">
          <NumberInput min={20} max={500} step={10} />
        </FormField>
        <FormField name={['profileConfig', 'links']} label="社交链接">
          <EditableList
            addButtonText="添加链接"
            dialogTitle="编辑社交链接"
            dialogFields={(_, iconValue) => (
              <>
                <FormField name="name" label="名称" rules={[{ required: true }]}>
                  <Input placeholder="请输入名称" />
                </FormField>
                <FormField
                  name="icon"
                  label={
                    <>
                      <span>图标</span>
                      <a href={process.env.ICONIFY_URL} target="_blank" rel="noreferrer">
                        &nbsp;访问 iconify
                      </a>
                    </>
                  }
                  rules={[{ required: true }]}
                >
                  <Input placeholder="例如: fa7-brands:github" suffix={iconValue ? <Icon icon={iconValue} width={20} height={20} /> : <span />} />
                </FormField>
                <FormField name="url" label="链接" rules={[{ required: true }]}>
                  <Input placeholder="请输入链接" />
                </FormField>
              </>
            )}
            itemRender={item => (
              <div className="flex min-w-0 items-center gap-2">
                <Badge>
                  <span className="block max-w-24 truncate" title={item.name}>
                    {item.name}
                  </span>
                </Badge>
                <Icon icon={item.icon} fontSize={20} />
                <CopyText value={item.url} className="min-w-0 flex-1" />
              </div>
            )}
          />
        </FormField>
      </>
    )
  },
  // 音乐播放器
  {
    key: 'music',
    label: '音乐播放器',

    children: (
      <>
        <FormField name={['musicPlayerConfig', 'enable']} valueKey="checked" label="启用">
          <Switch />
        </FormField>
        <FormField name={['musicPlayerConfig', 'showFloatingPlayer']} valueKey="checked" label="显示悬浮播放器">
          <Switch />
        </FormField>
        <FormField name={['musicPlayerConfig', 'floatingEntryMode']} label="悬浮入口模式">
          <Select
            options={[
              { label: '独立悬浮播放器', value: 'default' },
              { label: '集成到通用FAB', value: 'fab' }
            ]}
          />
        </FormField>
        <FormField name={['musicPlayerConfig', 'mode']} label="播放源">
          <Select
            options={[
              { label: '本地', value: 'local' },
              { label: 'Meting', value: 'meting' }
            ]}
          />
        </FormField>
        <FormField name={['musicPlayerConfig', 'meting_api']} label="Meting API地址">
          <Input placeholder="https://meting.mysqil.com/api?server=:server&type=:type&id=:id&auth=:auth&r=:r" />
        </FormField>
        <FormField name={['musicPlayerConfig', 'id']} label="歌单ID">
          <Input />
        </FormField>
        <FormField name={['musicPlayerConfig', 'server']} label="平台">
          <Input placeholder="例如: netease/tencent/kugou" />
        </FormField>
        <FormField name={['musicPlayerConfig', 'type']} label="播放类型">
          <Select options={[{ label: '歌单', value: 'playlist' }]} />
        </FormField>
      </>
    )
  },
  // 评论配置
  {
    key: 'comment',
    label: '评论配置',

    children: (
      <>
        <FormField name={['commentConfig', 'enable']} valueKey="checked" label="启用评论">
          <Switch />
        </FormField>
        <FormField name={['commentConfig', 'system']} label="评论系统">
          <Select
            options={[
              { label: 'Twikoo', value: 'twikoo' },
              { label: 'Giscus', value: 'giscus' }
            ]}
          />
        </FormField>
        <FormField unstyled observe={(prev, curr) => prev.commentConfig?.system !== curr.commentConfig?.system}>
          {({ getValue }) => {
            const system = getValue(['commentConfig', 'system'])
            if (system === 'twikoo') {
              return (
                <FormField name={['commentConfig', 'twikoo', 'envId']} label="Twikoo环境ID">
                  <Input />
                </FormField>
              )
            }
            if (system === 'giscus') {
              return (
                <>
                  <FormField name={['commentConfig', 'giscus', 'repo']} label="Giscus仓库" rules={[{ required: true }]}>
                    <Input placeholder="username/repo-name" />
                  </FormField>
                  <FormField name={['commentConfig', 'giscus', 'repoId']} label="仓库ID" rules={[{ required: true }]}>
                    <Input />
                  </FormField>
                  <FormField name={['commentConfig', 'giscus', 'category']} label="分类" rules={[{ required: true }]}>
                    <Input />
                  </FormField>
                  <FormField name={['commentConfig', 'giscus', 'categoryId']} label="分类ID" rules={[{ required: true }]}>
                    <Input />
                  </FormField>
                  <FormField name={['commentConfig', 'giscus', 'mapping']} label="映射">
                    <Select
                      defaultValue="pathname"
                      options={[
                        { label: 'pathname', value: 'pathname' },
                        { label: 'url', value: 'url' },
                        { label: 'title', value: 'title' },
                        { label: 'og:title', value: 'og:title' }
                      ]}
                    />
                  </FormField>
                  <FormField name={['commentConfig', 'giscus', 'strict']} label="严格模式">
                    <Select
                      options={[
                        { label: '0', value: '0' },
                        { label: '1', value: '1' }
                      ]}
                    />
                  </FormField>
                  <FormField name={['commentConfig', 'giscus', 'reactionsEnabled']} label="启用表情">
                    <Select
                      options={[
                        { label: '1', value: '1' },
                        { label: '0', value: '0' }
                      ]}
                    />
                  </FormField>
                  <FormField name={['commentConfig', 'giscus', 'inputPosition']} label="输入位置">
                    <Select
                      options={[
                        { label: 'top', value: 'top' },
                        { label: 'bottom', value: 'bottom' }
                      ]}
                    />
                  </FormField>
                  <FormField name={['commentConfig', 'giscus', 'theme']} label="主题">
                    <Select
                      options={[
                        { label: '跟随系统', value: 'preferred_color_scheme' },
                        { label: '浅色', value: 'light' },
                        { label: '深色', value: 'dark' }
                      ]}
                    />
                  </FormField>
                  <FormField name={['commentConfig', 'giscus', 'lang']} label="语言">
                    <Select
                      options={[
                        { label: '中文', value: 'zh_CN' },
                        { label: '英文', value: 'en' }
                      ]}
                    />
                  </FormField>
                  <FormField name={['commentConfig', 'giscus', 'loading']} label="加载方式">
                    <Select
                      options={[
                        { label: 'lazy', value: 'lazy' },
                        { label: 'eager', value: 'eager' }
                      ]}
                    />
                  </FormField>
                </>
              )
            }
            return null
          }}
        </FormField>
      </>
    )
  },
  // 樱花特效
  {
    key: 'sakura',
    label: '樱花特效',

    children: (
      <>
        <div className="grid gap-x-4 md:grid-cols-12">
          <div className="md:col-span-12">
            <FormField name={['sakuraConfig', 'enable']} valueKey="checked" label="启用樱花">
              <Switch />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'sakuraNum']} label="樱花数量">
              <NumberInput min={1} max={50} className="w-full" />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'limitTimes']} label="越界限制次数(-1为无限)">
              <NumberInput min={-1} className="w-full" />
            </FormField>
          </div>
        </div>
        <Divider orientation="horizontal">尺寸范围</Divider>
        <div className="grid gap-x-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'size', 'min']} label="最小尺寸倍数">
              <NumberInput min={0.1} max={2} step={0.1} className="w-full" />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'size', 'max']} label="最大尺寸倍数">
              <NumberInput min={0.1} max={2} step={0.1} className="w-full" />
            </FormField>
          </div>
        </div>
        <Divider orientation="horizontal">透明度</Divider>
        <div className="grid gap-x-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'opacity', 'min']} label="最小透明度">
              <NumberInput min={0} max={1} step={0.1} className="w-full" />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'opacity', 'max']} label="最大透明度">
              <NumberInput min={0} max={1} step={0.1} className="w-full" />
            </FormField>
          </div>
        </div>
        <Divider orientation="horizontal">速度</Divider>
        <div className="grid gap-x-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'speed', 'horizontal', 'min']} label="水平速度最小值">
              <NumberInput className="w-full" step={0.1} />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'speed', 'horizontal', 'max']} label="水平速度最大值">
              <NumberInput className="w-full" step={0.1} />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'speed', 'vertical', 'min']} label="垂直速度最小值">
              <NumberInput className="w-full" step={0.1} />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'speed', 'vertical', 'max']} label="垂直速度最大值">
              <NumberInput className="w-full" step={0.1} />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'speed', 'rotation']} label="旋转速度">
              <NumberInput className="w-full" step={0.01} />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['sakuraConfig', 'speed', 'fadeSpeed']} label="消失速度">
              <NumberInput className="w-full" step={0.01} />
            </FormField>
          </div>
          <div className="md:col-span-12">
            <FormField name={['sakuraConfig', 'zIndex']} label="层级">
              <NumberInput />
            </FormField>
          </div>
        </div>
      </>
    )
  },
  // 看板娘
  {
    key: 'pio',
    label: '看板娘',

    children: (
      <>
        <div className="grid gap-x-4 md:grid-cols-12">
          <div className="md:col-span-12">
            <FormField name={['pioConfig', 'enable']} valueKey="checked" label="启用">
              <Switch />
            </FormField>
          </div>
          <div className="md:col-span-12">
            <FormField name={['pioConfig', 'hiddenOnMobile']} valueKey="checked" label="移动端隐藏">
              <Switch />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['pioConfig', 'position']} label="位置">
              <Select
                options={[
                  { label: '左侧', value: 'left' },
                  { label: '右侧', value: 'right' }
                ]}
              />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['pioConfig', 'mode']} label="模式">
              <Select
                options={[
                  { label: '可拖拽', value: 'draggable' },
                  { label: '固定', value: 'fixed' }
                ]}
              />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['pioConfig', 'width']} label="宽度(px)">
              <NumberInput min={100} className="w-full" />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['pioConfig', 'height']} label="高度(px)">
              <NumberInput min={100} className="w-full" />
            </FormField>
          </div>
        </div>
        <Divider orientation="horizontal">对话框配置</Divider>
        <div className="grid gap-x-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <FormField name={['pioConfig', 'dialog', 'welcome']} label="欢迎语">
              <Input />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['pioConfig', 'dialog', 'home']} label="首页提示">
              <Input />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['pioConfig', 'dialog', 'close']} label="关闭提示">
              <Input />
            </FormField>
          </div>
          <div className="md:col-span-6">
            <FormField name={['pioConfig', 'dialog', 'link']} label="关于链接">
              <Input />
            </FormField>
          </div>
          <div className="md:col-span-12">
            <FormField name={['pioConfig', 'dialog', 'touch']} label="触摸提示">
              <StringListEditor addText="添加提示" />
            </FormField>
          </div>
          <div className="md:col-span-12">
            <FormField name={['pioConfig', 'dialog', 'skin']} label="换装提示">
              <StringListEditor addText="添加提示" />
            </FormField>
          </div>
        </div>
      </>
    )
  },
  // 其他
  {
    key: 'other',
    label: '其他',

    children: (
      <>
        {/* 版权声明 */}
        <Divider orientation="horizontal">版权声明</Divider>
        <FormField name={['licenseConfig', 'enable']} valueKey="checked" label="启用版权声明">
          <Switch />
        </FormField>
        <FormField name={['licenseConfig', 'name']} label="许可证名称">
          <Input />
        </FormField>
        <FormField name={['licenseConfig', 'url']} label="许可证链接" rules={[{ message: '请输入有效的URL' }]}>
          <Input placeholder="https://creativecommons.org/licenses/by-nc-sa/4.0/" />
        </FormField>

        {/* 公告配置 */}
        <Divider orientation="horizontal">公告配置</Divider>
        <FormField name={['announcementConfig', 'title']} label="公告标题">
          <Input placeholder="留空使用默认标题" />
        </FormField>
        <FormField name={['announcementConfig', 'content']} label="公告内容">
          <Textarea rows={5} />
        </FormField>
        <FormField name={['announcementConfig', 'closable']} valueKey="checked" label="公告可关闭">
          <Switch />
        </FormField>
        <FormField name={['announcementConfig', 'link', 'enable']} valueKey="checked" label="公告链接">
          <Switch />
        </FormField>
        <FormField name={['announcementConfig', 'link', 'text']} label="链接文本">
          <Input placeholder="了解更多" />
        </FormField>
        <FormField name={['announcementConfig', 'link', 'url']} label="链接地址">
          <Input placeholder="/about/" />
        </FormField>
        <FormField name={['announcementConfig', 'link', 'external']} valueKey="checked" label="外部链接">
          <Switch />
        </FormField>

        {/* 其他功能 */}
        <Divider orientation="horizontal">其他功能</Divider>
        <FormField name={['shareConfig', 'enable']} valueKey="checked" label="分享功能">
          <Switch />
        </FormField>
        <FormField name={['relatedPostsConfig', 'enable']} valueKey="checked" label="相关文章">
          <Switch />
        </FormField>
        <FormField name={['relatedPostsConfig', 'maxCount']} label="相关文章最大数量">
          <NumberInput min={1} max={20} />
        </FormField>
        <FormField name={['randomPostsConfig', 'enable']} valueKey="checked" label="随机文章">
          <Switch />
        </FormField>
        <FormField name={['randomPostsConfig', 'maxCount']} label="随机文章最大数量">
          <NumberInput min={1} max={20} />
        </FormField>
      </>
    )
  }
]

export default function Config() {
  const form = useForm()
  const [loading, setLoading] = useState(false)
  const [showReload, setShowReload] = useState(false)
  const db = useConfigContentDB()
  const originalData = useRef<any>(null) // 存表单修改前数据

  // 获取配置数据
  const getConfig = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getConfigData()
      if (res.data && typeof res.data === 'object') {
        // 保存原始数据
        originalData.current = res.data // {value, comment}
        await db.saveCache('original_data', JSON.stringify(res.data))
        // 解包value给表单
        const unwrappedData = unwrap(res.data, 'value')
        form.setValues(unwrappedData)
      } else notify.error('配置数据无效')
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  // 重载最新数据
  const reloadContent = useCallback(async () => {
    await getConfig()
    await db.clearCache('latest')
    setShowReload(false)
    notify.info('已重载为最新配置')
  }, [getConfig])

  // 保存
  const _handleSave = useCallback(async () => {
    if (loading) return
    try {
      setLoading(true)
      const values = await form.validate()
      const draft = JSON.parse(await db.getCache('latest'))
      const merged = deepMerge(draft, values) // 表单最新值覆盖掉缓存值
      const finalData = wrap(originalData.current, merged, 'value')
      const res = await writeConfigData(finalData)
      originalData.current = finalData
      if (res.success) {
        notify.success('保存成功')
        await db.clearCache('latest')
        await db.saveCache('original_data', JSON.stringify(finalData))
        setShowReload(false)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])
  const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

  // 保存草稿
  const _handleSaveDraft = useCallback(async (values: any) => {
    if (values) {
      await db.saveCache('latest', JSON.stringify(values))
      setShowReload(true)
    }
  }, [])
  const debouncedSaveDraft = useMemo(() => debounce(_handleSaveDraft, 500), [_handleSaveDraft])

  // 上传文件
  const _uploadFiles = async (file: File, fileList: File[], uploadFunc: (file: File, fileList: File[]) => Promise<any>): Promise<any> => {
    if (file === fileList[fileList.length - 1]) {
      try {
        setLoading(true)
        const res = await uploadFunc(file, fileList)
        if (res.success) {
          notify.success('上传成功')
          return res
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    return false
  }
  // 上传Logo或Icon
  const uploadHomeImg = async (file: File, fileList: File[], onSuccess?: (url: string) => void) => {
    const res = await _uploadFiles(file, fileList, (file: File) => uploadHomeImage(file))
    if (res.success) {
      onSuccess?.(res.data?.[0]?.publicPath)
      debouncedSaveDraft(form.getValues())
    }
    return false
  }
  // 上传头像
  const uploadAvatar = async (file: File, fileList: File[], onSuccess?: (url: string) => void) => {
    const res = await _uploadFiles(file, fileList, (file: File) => uploadAvatarImage(file))
    if (res.success) {
      onSuccess?.(res.data?.[0]?.publicPath)
      debouncedSaveDraft(form.getValues())
    }
    return false
  }
  // 上传PC壁纸
  const uploadPCWallpaperImages = async (file: File, fileList: File[], onSuccess?: (urls: string[]) => void) => {
    const res = await _uploadFiles(file, fileList, (_: File, fileList: File[]) => uploadPCWallpapers(fileList))
    if (res.success) onSuccess?.(res.data?.map((item: any) => item.publicPath))
    return false
  }
  // 上传移动端壁纸
  const uploadMobileWallpaperImages = async (file: File, fileList: File[], onSuccess?: (urls: string[]) => void) => {
    const res = await _uploadFiles(file, fileList, (_: File, fileList: File[]) => uploadMobileWallpapers(fileList))
    if (res.success) onSuccess?.(res.data?.map((item: any) => item.publicPath))
    return false
  }

  // 初始化
  useEffect(() => {
    db.getCache('latest').then(draft => {
      if (draft) {
        try {
          // 表单修改缓存
          const draftValue = JSON.parse(draft)
          if (draftValue && typeof draftValue === 'object') {
            // 原始数据缓存
            db.getCache('original_data').then(original => {
              if (original) {
                const originalValue = JSON.parse(original)
                if (originalValue && typeof originalValue === 'object') {
                  originalData.current = originalValue
                  form.setValues(draftValue)
                  setShowReload(true) // 只要有修改数据缓存就显示重载按钮
                } else throw new Error('原始缓存无效')
              } else throw new Error('原始缓存无效')
            })
          } else throw new Error('修改数据缓存无效')
        } catch {
          getConfig()
        }
      } else {
        getConfig()
      }
    })
  }, [])

  return (
    <Page className="max-w-5xl">
      <PageHeader
        eyebrow="Site settings"
        title="配置管理"
        description="集中维护站点基础信息、外观、导航、内容功能与交互设置。修改会自动保存为本地草稿。"
        actions={
          showReload ? (
            <>
              <ConfirmDialog
                trigger={
                  <Button icon={<RefreshCw className="size-4" />} loading={loading}>
                    重载配置
                  </Button>
                }
                title="放弃当前配置草稿？"
                description="未保存的本地修改将被服务器上的最新配置替换。"
                onConfirm={reloadContent}
              />
              <Button variant="default" icon={<Save className="size-4" />} loading={loading} onClick={throttledSave}>
                保存配置
              </Button>
            </>
          ) : null
        }
      />

      <PageSection
        title="配置项"
        description={showReload ? '本地草稿尚未同步到服务器' : '当前配置已与服务器同步'}
        bodyClassName="relative p-4 sm:p-5"
      >
        <Form form={form} onValuesChange={() => debouncedSaveDraft(form.getValues())} initialValues={defaultValues}>
          <Accordion items={settingsSections(uploadHomeImg, uploadAvatar, uploadPCWallpaperImages, uploadMobileWallpaperImages)} />
        </Form>
        {loading && (
          <div className="absolute inset-0 z-20 grid min-h-64 place-items-center rounded-b-xl bg-background/65 backdrop-blur-[1px]">
            <LoaderCircle className="size-7 animate-spin text-primary" />
          </div>
        )}
      </PageSection>
    </Page>
  )
}
