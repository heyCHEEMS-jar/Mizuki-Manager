import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { fields } from './fields'
import { optionTranslations } from './options'
import { labelTranslations } from './labels'

const resources = {
  zh: {
    translation: {
      common: {
        confirm: '确定',
        cancel: '取消',
        close: '关闭',
        edit: '编辑内容',
        panel: '侧边面板',
        continue: '请确认是否继续此操作',
        loading: '加载中...',
        clear: '清空',
        showPassword: '显示密码',
        hidePassword: '隐藏密码',
        selectAll: '全选',
        selected: '已选择 {{count}} 项',
        delete: '删除',
        previous: '上一页',
        next: '下一页',
        perPage: '{{count}} 条',
        jumpTo: '跳至',
        page: '页',
        save: '保存',
        editAction: '编辑',
        addAction: '添加',
        upload: '上传',
        view: '查看',
        visit: '访问',
        play: '播放',
        folders: '目录',
        rename: '重命名',
        back: '返回列表',
        restore: '恢复默认',
        clearLogs: '清空日志',
        stopProcess: '终止进程',
        deploy: '一键部署',
        startDeploy: '开始部署',
        stop: '终止',
        newPost: '新建文章',
        noData: '暂无数据',
        remove: '移除',
        imagePreview: '图片预览',
        previewImage: '预览图片',
        viewOriginal: '查看原始图片',
        zoomOut: '缩小图片',
        zoomIn: '放大图片',
        resetImage: '还原图片',
        closePreview: '关闭预览',
        required: '{{field}}不能为空',
        field: '该字段',
        invalidDate: '请输入有效的日期',
        validationFailed: '字段校验失败'
      },
      fields: fields.zh,
      notifications: {
        saveSuccess: '保存成功',
        replaceSuccess: '替换成功',
        copied: '已复制到剪切板',
        copyFailed: '复制失败',
        uploadSuccess: '上传成功',
        deleteSuccess: '删除成功',
        nameRequired: '新名称不能为空',
        renameSuccess: '重命名成功',
        addSuccess: '添加成功',
        recordSuccess: '记录成功',
        editSuccess: '修改成功',
        clearLogSuccess: '已清空日志缓存',
        clearFailed: '清空失败',
        deployStopped: '已停止部署',
        invalidConfig: '配置数据无效',
        configReloaded: '已重载为最新配置',
        createSuccess: '创建成功',
        requestFailed: '请求失败',
        refreshFailed: '登录刷新失败，请稍后重试',
        connectionError: '连接异常'
      },
      buildLogs: {
        installing: '\n[系统] 正在安装更新依赖...\n',
        preparing: '\n[系统] 准备启动构建任务...\n',
        connected: '\n---\n已连接部署进程\n{{time}}\n---\n',
        movingFiles: '\n[系统] 构建完成，正在迁移文件到部署目录...\n',
        completed: '\n[系统] 部署完成\n',
        systemMessage: '\n[系统] {{message}}\n',
        errorMessage: '\n[错误] {{message}}\n'
      },
      api: {
        common: {
          fetchFailed: '获取失败',
          createFailed: '创建失败',
          deleteFailed: '删除失败',
          updateFailed: '修改失败',
          renameFailed: '重命名失败'
        },
        validation: {
          directoryRequired: '请传入目录',
          filenameRequired: '请传入文件名',
          dataRequired: '请传入数据'
        },
        upload: {
          fileRequired: '请上传文件',
          invalidFormat: '请上传正确的文件格式：{{filename}}',
          fileTooLarge: '文件大小不能超过 {{maxSizeMb}} MB',
          fileAlreadyExists: '名为 {{filename}} 的文件已存在',
          batchFailed: '上传失败：{{failedItems}}',
          failed: '上传失败',
          failedFile: '文件上传失败：{{filename}}',
          markdownRequired: '请上传 Markdown 文件'
        },
        cleanup: {
          oldFilesFailed: '旧文件清理失败',
          oldFilesFailedWithPaths: '旧文件清理失败：{{paths}}'
        },
        config: {
          readFailed: '获取配置文件失败',
          updateFailed: '配置更新失败',
          infoAutoCreated: '配置文件不存在，已自动创建'
        },
        file: {
          readFailed: '文件读取失败',
          replaceFailed: '替换失败',
          notFound: '文件不存在',
          invalid: '请传入正确的文件',
          invalidName: '请传入正确的文件名',
          invalidNewName: '请传入正确的新文件名',
          invalidNamePattern: '文件名不能有特殊符号，长度最大为 {{maxLength}} 个字符',
          invalidPaths: '请传入正确的文件路径',
          deleteFailedWithPaths: '以下文件删除失败：{{filePaths}}',
          alreadyExists: '当前名称的文件已存在',
          markdownFilenameRequired: '请输入 Markdown 格式的文件名'
        },
        content: {
          invalid: '请正确输入新内容',
          required: '新内容不能为空'
        },
        directory: {
          alreadyExists: '该目录已存在',
          notFound: '未找到该目录'
        },
        album: {
          invalidFolderName: '请传入正确的文件夹名',
          invalidFolderPath: '请传入正确的文件夹路径'
        },
        pagination: {
          invalidPageNumber: '请传入正确的页码',
          invalidPageSize: '请传入正确的每页数量'
        },
        post: {
          listFailed: '获取所有文章失败',
          createFailed: '添加失败',
          invalidNamePattern: '文章名称不能有特殊符号，长度最大为 {{maxLength}} 个字符'
        },
        auth: {
          loginRequired: '请先登录',
          invalidCredential: '登录凭证无效',
          sessionExpired: '登录凭证已失效，请重新登录',
          sessionConflict: '检测到多端登录，已强制退出当前账号',
          credentialMissing: '未提供登录凭证',
          credentialMalformed: '登录凭证错误',
          authenticationFailed: '身份认证失败'
        },
        build: {
          noRunningTask: '无运行中的任务',
          stopFailed: '终止部署失败',
          taskAlreadyRunning: '已有在运行中的任务',
          installFailed: '安装更新依赖失败',
          failed: '构建失败：退出码 {{exitCode}}',
          startFailed: '构建进程启动失败：{{detail}}'
        },
        security: { illegalPath: '非法路径访问' },
        route: { notFound: '无效的资源路径' },
        server: { internalError: '服务器内部错误' },
        logoutSuccess: '退出成功'
      },
      app: {
        blogManager: '博客内容管理',
        navigation: '功能导航',
        openNavigation: '打开功能导航',
        sessionConflict: '检测到多端登录',
        sessionExpired: '当前会话已失效，请重新登录',
        notFound: '页面不存在',
        notFoundDescription: '你访问的页面可能已被移动或删除。',
        backHome: '返回首页'
      },
      nav: {
        home: '首页',
        about: '关于',
        album: '相册',
        anime: '追番',
        builder: '构建部署',
        config: '配置',
        device: '我的设备',
        diary: '日记',
        friend: '友链',
        music: '音乐播放器',
        post: '文章',
        project: '项目展示',
        skill: '技能展示',
        timeline: '时间线'
      },
      navSub: {
        home: '主页',
        about: '关于页面',
        album: '图片管理',
        anime: '追番记录',
        builder: '构建与部署',
        config: '站点配置',
        device: '设备清单',
        diary: '生活记录',
        friend: '友情链接',
        music: '音乐管理',
        post: '文章管理',
        project: '项目作品',
        skill: '技能管理',
        timeline: '成长经历'
      },
      language: { label: '切换语言', zh: '中', en: 'EN' },
      time: { year: '年', week: '周', day: '天', hour: '小时', minute: '分钟', second: '秒' },
      login: {
        brand: 'Mizuki 博客管理器',
        slogan: '让内容管理保持简单、清晰且专注。',
        summary: '集中管理博客内容、媒体资源与站点配置。',
        adminOnly: '仅限博客管理员访问',
        title: '登录管理后台',
        description: '请输入管理员账号和密码继续。',
        username: '用户名',
        usernamePlaceholder: '请输入用户名',
        password: '密码',
        passwordPlaceholder: '请输入密码',
        captcha: '验证码',
        captchaPlaceholder: '请输入验证码',
        refreshCaptcha: '点击刷新验证码',
        forgot: '忘记密码？',
        credentialsHint: '默认账号密码在 .env 环境配置中更改',
        expires: '登录有效期：{{time}}',
        submit: '登录',
        welcome: '欢迎回来',
        usernameRequired: '请先输入用户名',
        credentialsRequired: '账号或密码不能为空',
        invalidCaptcha: '请输入正确的验证码',
        invalidCredentials: '用户名或密码错误',
        failed: '登录失败',
        refreshCaptchaFailed: '刷新验证码失败'
      },
      dashboard: {
        description: '管理博客内容、媒体资源、构建任务与站点配置。',
        theme: '主题颜色',
        customTheme: '自定义主题颜色',
        switchTheme: '切换主题色 {{theme}}',
        logout: '退出登录',
        logoutTitle: '退出登录？',
        logoutDescription: '当前设备上的登录状态将被清除。',
        exit: '退出',
        features: '管理功能',
        featureDescription: '选择需要维护的内容模块。',
        server: '服务器状态',
        serverDescription: '系统信息每 30 秒自动更新。',
        loadingServer: '正在获取服务器信息...',
        hostname: '主机名',
        platform: '平台',
        architecture: '架构',
        release: '系统版本',
        cpu: 'CPU 核心数',
        totalMemory: '总内存',
        freeMemory: '空闲内存',
        uptime: '运行时间',
        load: '系统负载'
      },
      pages: {
        about: { title: '关于页面', description: '编辑网站关于页面使用的 Markdown 文档。输入内容会自动保存为本地草稿。', add: '上传文档' },
        album: {
          title: '相册管理',
          description: '选择或创建相册目录后开始管理图片。',
          folderDescription: '管理当前相册中的图片与展示配置。',
          add: '添加图片'
        },
        anime: { title: '追番记录', description: '维护观看状态、进度、评分与番剧资料。', add: '添加追番', deleteTitle: '删除选中的追番记录？' },
        builder: { title: '构建部署', description: '构建项目并将最新资源同步到生产环境。' },
        config: { title: '配置管理', description: '集中维护站点基础信息、外观、导航、内容功能与交互设置。修改会自动保存为本地草稿。' },
        device: { title: '设备清单', description: '管理数码设备、规格信息与产品链接。', add: '添加设备', deleteTitle: '删除选中的设备？' },
        diary: { title: '日记管理', description: '记录生活片段、心情、地点和影像。', add: '写日记', deleteTitle: '删除选中的日记？' },
        friend: { title: '友链管理', description: '维护友好站点、站点描述与分类标签。', add: '新增友链', deleteTitle: '删除选中的友链？' },
        music: { title: '歌单管理', description: '维护音乐播放器中的歌曲、封面和音频资源。', add: '新增歌曲', deleteTitle: '删除选中的歌曲？' },
        post: { title: '文章管理', description: '创建、上传和维护博客 Markdown 文章。', add: '上传文章' },
        project: { title: '项目管理', description: '维护项目作品、技术栈、状态和访问链接。', add: '新增项目', deleteTitle: '删除选中的项目？' },
        skill: { title: '技能管理', description: '展示技术栈、熟练程度、经验和相关认证。', add: '添加技能', deleteTitle: '删除选中的技能？' },
        timeline: { title: '时间线管理', description: '维护成长经历、重要里程碑和相关成果。', add: '添加条目', deleteTitle: '删除选中的时间线条目？' }
      }
    }
  },
  en: {
    translation: {
      common: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        close: 'Close',
        edit: 'Edit content',
        panel: 'Side panel',
        continue: 'Please confirm to continue.',
        loading: 'Loading...',
        clear: 'Clear',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        selectAll: 'Select all',
        selected: '{{count}} selected',
        delete: 'Delete',
        previous: 'Previous page',
        next: 'Next page',
        perPage: '{{count}} / page',
        jumpTo: 'Go to',
        page: 'page',
        save: 'Save',
        editAction: 'Edit',
        addAction: 'Add',
        upload: 'Upload',
        view: 'View',
        visit: 'Visit',
        play: 'Play',
        folders: 'Folders',
        rename: 'Rename',
        back: 'Back to list',
        restore: 'Restore defaults',
        clearLogs: 'Clear logs',
        stopProcess: 'Stop process',
        deploy: 'Deploy',
        startDeploy: 'Start deployment',
        stop: 'Stop',
        newPost: 'New post',
        noData: 'No data',
        remove: 'Remove',
        imagePreview: 'Image preview',
        previewImage: 'Preview image',
        viewOriginal: 'View original image',
        zoomOut: 'Zoom out',
        zoomIn: 'Zoom in',
        resetImage: 'Reset image',
        closePreview: 'Close preview',
        required: '{{field}} is required',
        field: 'This field',
        invalidDate: 'Enter a valid date',
        validationFailed: 'Validation failed'
      },
      fields: fields.en,
      notifications: {
        saveSuccess: 'Saved successfully',
        replaceSuccess: 'Replaced successfully',
        copied: 'Copied to clipboard',
        copyFailed: 'Copy failed',
        uploadSuccess: 'Uploaded successfully',
        deleteSuccess: 'Deleted successfully',
        nameRequired: 'The new name is required',
        renameSuccess: 'Renamed successfully',
        addSuccess: 'Added successfully',
        recordSuccess: 'Recorded successfully',
        editSuccess: 'Updated successfully',
        clearLogSuccess: 'Build log cache cleared',
        clearFailed: 'Clear failed',
        deployStopped: 'Deployment stopped',
        invalidConfig: 'Invalid configuration data',
        configReloaded: 'Reloaded the latest configuration',
        createSuccess: 'Created successfully',
        requestFailed: 'Request failed',
        refreshFailed: 'Sign-in refresh failed. Please try again later.',
        connectionError: 'Connection error'
      },
      buildLogs: {
        installing: '\n[System] Installing dependency updates...\n',
        preparing: '\n[System] Preparing to start the build...\n',
        connected: '\n---\nConnected to the deployment process\n{{time}}\n---\n',
        movingFiles: '\n[System] Build complete. Moving files to the deployment directory...\n',
        completed: '\n[System] Deployment complete\n',
        systemMessage: '\n[System] {{message}}\n',
        errorMessage: '\n[Error] {{message}}\n'
      },
      api: {
        common: {
          fetchFailed: 'Failed to fetch data',
          createFailed: 'Failed to create',
          deleteFailed: 'Failed to delete',
          updateFailed: 'Failed to update',
          renameFailed: 'Failed to rename'
        },
        validation: {
          directoryRequired: 'A directory is required.',
          filenameRequired: 'A filename is required.',
          dataRequired: 'Data is required.'
        },
        upload: {
          fileRequired: 'Select a file to upload.',
          invalidFormat: 'Unsupported file format: {{filename}}',
          fileTooLarge: 'The file size cannot exceed {{maxSizeMb}} MB.',
          fileAlreadyExists: 'A file named {{filename}} already exists.',
          batchFailed: 'Upload failed: {{failedItems}}',
          failed: 'Upload failed',
          failedFile: 'Failed to upload file: {{filename}}',
          markdownRequired: 'Select a Markdown file.'
        },
        cleanup: {
          oldFilesFailed: 'Failed to clean up old files',
          oldFilesFailedWithPaths: 'Failed to clean up old files: {{paths}}'
        },
        config: {
          readFailed: 'Failed to read the configuration file',
          updateFailed: 'Failed to update the configuration',
          infoAutoCreated: 'The configuration file was missing and has been created automatically.'
        },
        file: {
          readFailed: 'Failed to read the file',
          replaceFailed: 'Failed to replace the file',
          notFound: 'File not found',
          invalid: 'Provide a valid file.',
          invalidName: 'Provide a valid filename.',
          invalidNewName: 'Provide a valid new filename.',
          invalidNamePattern: 'The filename cannot contain special characters and must be no more than {{maxLength}} characters.',
          invalidPaths: 'Provide valid file paths.',
          deleteFailedWithPaths: 'The following files could not be deleted: {{filePaths}}',
          alreadyExists: 'A file with this name already exists.',
          markdownFilenameRequired: 'Enter a Markdown filename.'
        },
        content: {
          invalid: 'Provide valid new content.',
          required: 'New content is required.'
        },
        directory: {
          alreadyExists: 'The directory already exists.',
          notFound: 'Directory not found'
        },
        album: {
          invalidFolderName: 'Provide a valid folder name.',
          invalidFolderPath: 'Provide a valid folder path.'
        },
        pagination: {
          invalidPageNumber: 'Provide a valid page number.',
          invalidPageSize: 'Provide a valid page size.'
        },
        post: {
          listFailed: 'Failed to fetch posts',
          createFailed: 'Failed to add the post',
          invalidNamePattern: 'The post name cannot contain special characters and must be no more than {{maxLength}} characters.'
        },
        auth: {
          loginRequired: 'Sign in first.',
          invalidCredential: 'Invalid sign-in credentials',
          sessionExpired: 'Your sign-in session has expired. Sign in again.',
          sessionConflict: 'Another sign-in was detected, so this session has been signed out.',
          credentialMissing: 'Sign-in credentials were not provided.',
          credentialMalformed: 'The sign-in credentials are malformed.',
          authenticationFailed: 'Authentication failed'
        },
        build: {
          noRunningTask: 'No deployment task is running.',
          stopFailed: 'Failed to stop the deployment',
          taskAlreadyRunning: 'A task is already running.',
          installFailed: 'Failed to install dependency updates.',
          failed: 'Build failed with exit code {{exitCode}}.',
          startFailed: 'Failed to start the build process: {{detail}}'
        },
        security: { illegalPath: 'Access to this path is not allowed.' },
        route: { notFound: 'Invalid resource path' },
        server: { internalError: 'Internal server error' },
        logoutSuccess: 'Signed out successfully'
      },
      options: optionTranslations,
      labels: labelTranslations,
      app: {
        blogManager: 'Blog content management',
        navigation: 'Navigation',
        openNavigation: 'Open navigation',
        sessionConflict: 'Multiple sign-ins detected',
        sessionExpired: 'This session is no longer valid. Please sign in again.',
        notFound: 'Page not found',
        notFoundDescription: 'The page may have been moved or deleted.',
        backHome: 'Back to home'
      },
      nav: {
        home: 'Home',
        about: 'About',
        album: 'Album',
        anime: 'Anime',
        builder: 'Build & Deploy',
        config: 'Configuration',
        device: 'My Devices',
        diary: 'Diary',
        friend: 'Friends',
        music: 'Music Player',
        post: 'Posts',
        project: 'Projects',
        skill: 'Skills',
        timeline: 'Timeline'
      },
      navSub: {
        home: 'Dashboard',
        about: 'About page',
        album: 'Image management',
        anime: 'Watch list',
        builder: 'Build and deployment',
        config: 'Site settings',
        device: 'Device list',
        diary: 'Life moments',
        friend: 'Friend links',
        music: 'Music management',
        post: 'Post management',
        project: 'Portfolio',
        skill: 'Skill management',
        timeline: 'Experience'
      },
      language: { label: 'Switch language', zh: '中', en: 'EN' },
      time: {
        year: 'Year',
        year_one: 'year',
        year_other: 'years',
        week_one: 'week',
        week_other: 'weeks',
        day_one: 'day',
        day_other: 'days',
        hour_one: 'hour',
        hour_other: 'hours',
        minute_one: 'minute',
        minute_other: 'minutes',
        second_one: 'second',
        second_other: 'seconds'
      },
      login: {
        brand: 'Mizuki Blog Manager',
        slogan: 'Keep content management simple, clear, and focused.',
        summary: 'Manage blog content, media, and site settings in one place.',
        adminOnly: 'Blog administrators only',
        title: 'Sign in to the dashboard',
        description: 'Enter your administrator credentials to continue.',
        username: 'Username',
        usernamePlaceholder: 'Enter username',
        password: 'Password',
        passwordPlaceholder: 'Enter password',
        captcha: 'Verification code',
        captchaPlaceholder: 'Enter verification code',
        refreshCaptcha: 'Refresh verification code',
        forgot: 'Forgot password?',
        credentialsHint: 'Change the default credentials in the .env configuration.',
        expires: 'Session duration: {{time}}',
        submit: 'Sign in',
        welcome: 'Welcome back',
        usernameRequired: 'Enter your username first.',
        credentialsRequired: 'Username and password are required.',
        invalidCaptcha: 'Enter the correct verification code.',
        invalidCredentials: 'Incorrect username or password.',
        failed: 'Sign-in failed.',
        refreshCaptchaFailed: 'Failed to refresh the verification code.'
      },
      dashboard: {
        description: 'Manage blog content, media, build tasks, and site settings.',
        theme: 'Theme colors',
        customTheme: 'Custom theme color',
        switchTheme: 'Switch theme color to {{theme}}',
        logout: 'Sign out',
        logoutTitle: 'Sign out?',
        logoutDescription: 'The sign-in state on this device will be cleared.',
        exit: 'Sign out',
        features: 'Management',
        featureDescription: 'Choose a content module to manage.',
        server: 'Server status',
        serverDescription: 'System information refreshes every 30 seconds.',
        loadingServer: 'Loading server information...',
        hostname: 'Hostname',
        platform: 'Platform',
        architecture: 'Architecture',
        release: 'System version',
        cpu: 'CPU cores',
        totalMemory: 'Total memory',
        freeMemory: 'Free memory',
        uptime: 'Uptime',
        load: 'System load'
      },
      pages: {
        about: {
          title: 'About',
          description: 'Edit the Markdown document used on the About page. Changes are saved locally as a draft.',
          add: 'Upload document'
        },
        album: {
          title: 'Album management',
          description: 'Select or create an album folder to manage images.',
          folderDescription: 'Manage images and display settings in this album.',
          add: 'Add image'
        },
        anime: {
          title: 'Anime watch list',
          description: 'Manage watch status, progress, ratings, and anime details.',
          add: 'Add anime',
          deleteTitle: 'Delete selected anime entries?'
        },
        builder: { title: 'Build & Deploy', description: 'Build the project and sync the latest assets to production.' },
        config: {
          title: 'Configuration',
          description: 'Manage site information, appearance, navigation, content features, and interactions. Changes are saved locally as a draft.'
        },
        device: {
          title: 'Devices',
          description: 'Manage devices, specifications, and product links.',
          add: 'Add device',
          deleteTitle: 'Delete selected devices?'
        },
        diary: {
          title: 'Diary',
          description: 'Record moments, moods, locations, and images.',
          add: 'Write entry',
          deleteTitle: 'Delete selected diary entries?'
        },
        friend: {
          title: 'Friend links',
          description: 'Manage friendly sites, descriptions, and category tags.',
          add: 'Add friend',
          deleteTitle: 'Delete selected friend links?'
        },
        music: {
          title: 'Playlist',
          description: 'Manage songs, covers, and audio resources in the music player.',
          add: 'Add song',
          deleteTitle: 'Delete selected songs?'
        },
        post: { title: 'Posts', description: 'Create, upload, and maintain Markdown posts.', add: 'Upload post' },
        project: {
          title: 'Projects',
          description: 'Manage portfolio projects, technology stacks, status, and links.',
          add: 'Add project',
          deleteTitle: 'Delete selected projects?'
        },
        skill: {
          title: 'Skills',
          description: 'Show technology stacks, proficiency, experience, and certifications.',
          add: 'Add skill',
          deleteTitle: 'Delete selected skills?'
        },
        timeline: {
          title: 'Timeline',
          description: 'Manage experience, milestones, and related achievements.',
          add: 'Add entry',
          deleteTitle: 'Delete selected timeline entries?'
        }
      }
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('language') || 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false }
})

document.documentElement.lang = i18n.resolvedLanguage || 'zh'
i18n.on('languageChanged', language => {
  document.documentElement.lang = language
})

export default i18n
