let handle = 0 // 记录真正是否循环
let timeoutHandle = 0
let initClick = null

let loopNow = 0

let allStudents = null
let names = null
const luckyDogs = []
let pointsEnabled = true
let totalPoints = 0
const pointList = []
let studentNum = 0

//const urlParams = new URLSearchParams(window.location.search)
const ensureLoop = 20
const randomControl = 0.1
//const prizeType = urlParams.get('prize')
//const eventName = urlParams.get('event')
//const apiPoint = urlParams.get('api')
const method = "click_control"
// tradition 原有模式 click_control 用点击控制停止

// initial word should be as long as possible
// to get enough particles
window.textColor = 'white'
const interval = 140
let selected = '人数不足'

function main () {
  if (!data || !data.data) {
      setText('网络故障？')
      return
    }
    allStudents = data.data
    if (Array.isArray(allStudents)) {
      pointsEnabled = false
      names = allStudents
    } else {
      names = Object.keys(allStudents)
      names.forEach((name) => {
        const point = allStudents[name] + 1
        pointList.push(point)
        totalPoints += point
        studentNum += 1
      })
    }
}

function setText (s) {
  window.clearWord()
  window.nextText = [[], []]
  window.text = []
  window.createText(s)
}

function naiveSelect () {
  if (pointsEnabled) {
    const randPoint = Math.floor(Math.random() * totalPoints)
    let accumPoint = 0
    for (let i = 0; i < studentNum; i++) {
      accumPoint += pointList[i]
      if (accumPoint > randPoint) return names[i]
    }
  } else return names[Math.floor(Math.random() * names.length)]
}

function randomSelect () {
  selected = '人数不足'
  if (luckyDogs.length < names.length) {
    while (luckyDogs.includes((selected = naiveSelect())));
  }

  setText(selected)
  if (loopNow++ > ensureLoop && Math.random() < randomControl && handle !== 0 && method === 'tradition') {
    loopNow = 0
    clearInterval(handle)
    handle = 0
    luckyDogs.push(selected)
    setTimeout(() => {
      window.textColor = '#1d73c9'
    }, interval)
    timeoutHandle = setTimeout(restore, 10000)
  }
}

function restore () {
  if (handle === 0) {
    window.textColor = 'white'
    setText(eventName)
    if (method === 'click_control') {
      timeoutHandle = 0
    }
  }
}

window.onkeypress = function (e) {
  if (e.keyCode === 13) {
    window.location.reload()
  }
}

document.getElementById('play-zone').addEventListener('click', function () {
  if (!initClick) {
    initClick = 1
    return
  }
  if (!names) {
    setText('尚未就绪')
    return
  }
  if (handle === 0 && method === 'tradition') {
    clearTimeout(timeoutHandle) // 下一轮开始时，之前的timeout不要插嘴
    window.textColor = 'white'
    randomSelect() // 不要窒息1s
    handle = setInterval(randomSelect, interval)
  } else if (method === 'click_control' && timeoutHandle === 0) {
    window.textColor = 'white'
    randomSelect() // 不要窒息1s
    if (handle === 0) {
      handle = setInterval(randomSelect, interval)
    } else {
      clearInterval(handle)
      handle = 0
      luckyDogs.push(selected)
      setTimeout(() => {
        window.textColor = '#1d73c9'
      }, interval)
      timeoutHandle = setTimeout(restore, 5000)
    }
  }
})

main()
