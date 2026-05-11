let capture;
let bodyPose;
let handPose; // 加入手勢辨識變數
let poses = [];
let hands = []; // 存放手勢偵測結果
let earringImages = []; // 用陣列存放 5 個耳環圖片
let currentEarringIndex = 0; // 目前顯示的耳環索引 (0-4)

function preload() {
  // 載入 bodyPose 模型
  bodyPose = ml5.bodyPose();
  // 載入 handPose 模型
  handPose = ml5.handPose();

  // 載入 5 個耳環圖片，路徑依據需求設定
  earringImages[0] = loadImage('pictures/acc1_ring.png');
  earringImages[1] = loadImage('pictures/acc2_pearl.png');
  earringImages[2] = loadImage('pic/acc3_tassel.png');
  earringImages[3] = loadImage('pictures/acc4_jade.png');
  earringImages[4] = loadImage('pictures/acc5_phoenix.png');
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  capture.size(640, 480); // 設定固定擷取解析度以利辨識穩定
  capture.hide(); // 隱藏預設產生的 HTML5 video 元件

  // 開始偵測姿勢
  bodyPose.detectStart(capture, (results) => {
    poses = results;
  });

  // 開始偵測手勢
  handPose.detectStart(capture, (results) => {
    hands = results;
  });
}

function draw() {
  background('#f4f1de');

  let vWidth = width * 0.5;
  let vHeight = height * 0.5;
  let x = (width - vWidth) / 2;
  let y = (height - vHeight) / 2;

  // 偵測手勢手指數量並切換耳環
  if (hands.length > 0) {
    let fingerCount = getFingerCount(hands[0]);
    // 如果手指數量在 1~5 之間，更新目前使用的圖片索引
    if (fingerCount >= 1 && fingerCount <= 5) {
      currentEarringIndex = fingerCount - 1;
    }
  }

  push();
  // 實作左右顛倒（鏡像）
  translate(x + vWidth, y);
  scale(-1, 1);
  image(capture, 0, 0, vWidth, vHeight);

  // 繪製耳垂位置
  if (poses.length > 0) {
    let pose = poses[0];
    
    let points = [pose.left_ear, pose.right_ear];
    let img = earringImages[currentEarringIndex];
 
    points.forEach(pt => {
      if (pt && pt.confidence > 0.1) {
        // 將原始影像座標映射到畫布上的縮放尺寸
        let px = map(pt.x, 0, capture.width, 0, vWidth);
        let py = map(pt.y, 0, capture.height, 0, vHeight);
        
        // 在耳朵下方一點點的位置畫圓（模擬耳垂）
        fill('yellow');
        noStroke();
        circle(px, py + 5, 12);
 
        // 繪製目前選中的耳環圖片
        if (img) {
          let earringW = 30; // 設定耳環顯示寬度
          let earringH = earringW * (img.height / img.width); // 依比例計算高度
          image(img, px - earringW / 2, py + 5 - earringH / 2, earringW, earringH);
        }
      }
    });
  }
  pop();
}

// 計算伸出的手指頭數量的輔助函式
function getFingerCount(hand) {
  let count = 0;
  // 偵測食指、中指、無名指、小指是否伸直 (比較指尖與關節的 Y 座標)
  let tips = [8, 12, 16, 20];
  let pips = [6, 10, 14, 18];
  for (let i = 0; i < tips.length; i++) {
    if (hand.keypoints[tips[i]].y < hand.keypoints[pips[i]].y) {
      count++;
    }
  }
  // 大拇指判定：檢查指尖是否遠離手掌根部
  let thumbTip = hand.keypoints[4];
  let thumbBase = hand.keypoints[2];
  let pinkyBase = hand.keypoints[17];
  if (dist(thumbTip.x, thumbTip.y, pinkyBase.x, pinkyBase.y) > dist(thumbBase.x, thumbBase.y, pinkyBase.x, pinkyBase.y)) {
    count++;
  }
  return count;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
