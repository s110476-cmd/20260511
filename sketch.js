let capture;
let bodyPose;
let handPose;
let poses = [];
let hands = [];
let earringImages = [];
let currentEarringIndex = 0; // 預設顯示第一款耳環

function preload() {
  // 載入 bodyPose 模型
  bodyPose = ml5.bodyPose();
  // 載入 handPose 模型
  handPose = ml5.handPose();
  
  // 載入所有耳環圖片
  earringImages[0] = loadImage('pictures/acc1_ring.png');
  earringImages[1] = loadImage('pictures/acc2_pearl.png');
  earringImages[2] = loadImage('pictures/acc3_tassel.png');
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

  push();
  // 實作左右顛倒（鏡像）
  translate(x + vWidth, y);
  scale(-1, 1);
  image(capture, 0, 0, vWidth, vHeight);

  // 手勢辨識與切換耳環 (支援左手與右手)
  if (hands.length > 0) {
    // 檢查偵測到的每一隻手
    for (let hand of hands) {
      let count = 0;
      
      // 改用掌指關節 (mcp) 作為基準，比中間關節 (pip) 更穩定，減少手指半彎時的誤判
      if (hand.index_finger_tip.y < hand.index_finger_mcp.y) count++;
      if (hand.middle_finger_tip.y < hand.middle_finger_mcp.y) count++;
      if (hand.ring_finger_tip.y < hand.ring_finger_mcp.y) count++;
      if (hand.pinky_finger_tip.y < hand.pinky_finger_mcp.y) count++;
      
      // 大拇指判定優化：比較指尖到手腕與指根到手腕的距離
      let d_tip = dist(hand.thumb_tip.x, hand.thumb_tip.y, hand.wrist.x, hand.wrist.y);
      let d_joint = dist(hand.thumb_mcp.x, hand.thumb_mcp.y, hand.wrist.x, hand.wrist.y);
      if (d_tip > d_joint * 1.2) count++;

      // 根據手指數量 (1-5) 切換對應的耳環
      if (count >= 1 && count <= 5) {
        currentEarringIndex = count - 1;
      }
    }
  }

  // 繪製耳垂位置
  if (poses.length > 0) {
    let pose = poses[0];
    let points = [pose.left_ear, pose.right_ear];
    let earringImage = earringImages[currentEarringIndex];
 
    points.forEach(pt => {
      if (pt && pt.confidence > 0.1) {
        // 將原始影像座標映射到畫布上的縮放尺寸
        let px = map(pt.x, 0, capture.width, 0, vWidth);
        let py = map(pt.y, 0, capture.height, 0, vHeight);
        
        // 在耳朵下方一點點的位置畫圓（模擬耳垂）
        fill('yellow');
        noStroke();
        circle(px, py + 5, 12);
 
        // 繪製對應的耳環圖片
        if (earringImage) {
          let earringW = 40; // 調大寬度使效果較明顯
          let earringH = earringW * (earringImage.height / earringImage.width);
          // 將耳環圖片中心掛在耳垂點 (py + 5)
          image(earringImage, px - earringW / 2, py + 5 - earringH / 4, earringW, earringH);
        }
      }
    });
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
