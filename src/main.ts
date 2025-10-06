import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 引入Vant组件库
import { 
  Button, 
  Tabbar, 
  TabbarItem, 
  Icon, 
  Popup, 
  Form, 
  Field, 
  RadioGroup, 
  Radio, 
  Picker, 
  Toast, 
  DropdownMenu, 
  DropdownItem, 
  Empty,
  Cell,
  CellGroup,
  Card,
  Dialog
} from 'vant'

// 引入Vant样式
import 'vant/lib/index.css'

const app = createApp(App)

// 使用Vant组件
app.use(Button)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Icon)
app.use(Popup)
app.use(Form)
app.use(Field)
app.use(RadioGroup)
app.use(Radio)
app.use(Picker)
app.use(Toast)
app.use(DropdownMenu)
app.use(DropdownItem)
app.use(Empty)
app.use(Cell)
app.use(CellGroup)
app.use(Card)
app.use(Dialog)
app.use(router)

// 处理GitHub Pages 404重定向
const redirectPath = sessionStorage.getItem('redirectPath');
if (redirectPath && redirectPath !== '/') {
  // 清除存储的重定向路径
  sessionStorage.removeItem('redirectPath');
  
  // 使用路由器导航到目标路径
  router.push(redirectPath);
}

app.mount('#app')
