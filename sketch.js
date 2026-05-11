let capture;
let bodyPose;
let poses = [];
let earringImage; // 宣告耳環圖片變數

function preload() {
  // 載入 bodyPose 模型
  bodyPose = ml5.bodyPose();
  earringImage = loadImage('pic/acc1_ring.png'); // 載入耳環圖片，請確保路徑正確
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

  // 繪製耳垂位置
  if (poses.length > 0) {
    let pose = poses[0];
    
    // 定義要抓取的特徵點（左耳與右耳）
    let points = [pose.left_ear, pose.right_ear];
 
    fill('yellow');
    noStroke();
 
    points.forEach(pt => {
      if (pt && pt.confidence > 0.1) {
        // 將原始影像座標映射到畫布上的縮放尺寸
        let px = map(pt.x, 0, capture.width, 0, vWidth);
        let py = map(pt.y, 0, capture.height, 0, vHeight);
        // 在耳朵下方一點點的位置畫圓（模擬耳垂）
        let circleRadius = 12;
        circle(px, py + 5, circleRadius);
 
        // 繪製耳環圖片
        // 調整位置以將耳環圖片置中於耳垂點，並設定適當的大小
        let earringSize = 20; // 耳環圖片的尺寸，可依需求調整
        image(earringImage, px - earringSize / 2, py + 5 - earringSize / 2, earringSize, earringSize);
      }
    });
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
