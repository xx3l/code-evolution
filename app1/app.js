function getIt() {
  return {
    type: "herb",
    params: {
      roots: 9,
      health: 1
    },
    code: {
      timeStep: function(state, world) {
        state.age++;
        if (state.params.roots > 15) {
          world.roots2health(10);
        }
        if (state.age > 3 && state.params.health < 0.5) {
          world.roots2health(1);
        }
      }
    },
    state: {
      age: 0
    }
  }
}
module.exports = { getIt }
