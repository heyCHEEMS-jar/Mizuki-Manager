/**
 * @description Manager出口
 */
const AboutManager = require('./AboutManager.js')
const AlbumManager = require('./AlbumManager.js')
const AnimeManager = require('./AnimeManager.js')
const ConfigManager = require('./ConfigManager.js')
const DeviceManager = require('./DeviceManager.js')
const DiaryManager = require('./DiaryManager.js')
const FriendManager = require('./FriendManager.js')
const PostManager = require('./PostManager.js')
const ProjectManager = require('./ProjectManager.js')
const SkillManager = require('./SkillManager.js')
const TimelineManager = require('./TimelineManager.js')
const MusicManager = require('./MusicManager.js')
const BuildManager = require('./BuildManager.js')
const AuthManager = require('./AuthManager.js')
const SystemManager = require('./SystemManager.js')

const aboutManager = new AboutManager()
const albumManager = new AlbumManager()
const animeManager = new AnimeManager()
const configManager = new ConfigManager()
const deviceManager = new DeviceManager()
const diaryManager = new DiaryManager()
const friendManager = new FriendManager()
const postManager = new PostManager()
const projectManager = new ProjectManager()
const skillManager = new SkillManager()
const timelineManager = new TimelineManager()
const musicManager = new MusicManager()
const buildManager = new BuildManager()
const authManager = new AuthManager()
const systemManager = new SystemManager()

module.exports = {
	aboutManager,
	albumManager,
	animeManager,
	configManager,
	deviceManager,
	diaryManager,
	friendManager,
	postManager,
	projectManager,
	skillManager,
	timelineManager,
	musicManager,
	buildManager,
	authManager,
	systemManager
}
