const canvas = document.getElementById("mainCanvas");

let ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;

let cumballEntity = new Image();
cumballEntity.src = 'content/cumball.png';


function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    console.log("x: " + x + " y: " + y);
    return {x, y};
}

canvas.addEventListener('mousedown', addXtraCumBall, false);

let cumballInstances = [];
function addXtraCumBall(mouseEvent){
    const {x,y} = getCursorPosition(canvas, mouseEvent); 
    cumballInstances.push(new Ball(x, y));
}


document.getElementById('play-again').addEventListener('click', event => {
    cumballInstances = [];
}, false);

function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.dx = 32;
    this.dy = 32;
    this.friction = 0.8;
    this.update = function() {
      // Bounce off the edges
      if (this.x + this.dx < 0 ||
          this.x + this.dx > canvas.width) {
        this.dx = -this.dx * this.friction;
      }
      if (this.y + this.dy < 0 ||
          this.y + this.dy > canvas.height) {
        this.dy = -this.dy * this.friction;
      } else {
        // Our only acceleration is gravity
        this.dy += gravity;
      }
      
      this.x = this.x + this.dx;
      this.y = this.y + this.dy;
      
      ctx.drawImage(cumballEntity, this.x - this.dx / 2, this.y - this.dy / 2, 16,16);
    };
  }
  let gravity = 4.88;
  let timeStep = 50; // In milliseconds
  let cmTID;
  function updateAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cumballInstances.forEach(entity => {entity.update()});
    clearTimeout(cmTID);
    cmTID = setTimeout(updateAll, timeStep);
  }

  // Do the first update
  updateAll();
