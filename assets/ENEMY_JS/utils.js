export function drawStatusText(context, input, player) {
  context.font = "16px Arial";
  context.fillStyle = "black";
  context.fillText("Last input:" + input.lastKey, 10, 20);
  context.fillText("active state:" + player.currentState.state, 20, 90);
  context.fillText("previous state:" + player.previousState, 20, 110);
  context.fillText("FRAME X:" + player.frameX, 20, 130);
}
