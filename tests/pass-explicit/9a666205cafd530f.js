function* a() {
  ({b() {
    yield;
  }});
}