export function drawStatusText(context, input, player) {
  context.font = "16px Arial";
  context.fillStyle = "black";
  context.fillText("Last input:" + input.lastKey, 10, 20);
  context.fillText("active state:" + player.currentState.state, 20, 90);
}
