pragma circom 2.0.1;

template Test() {
  signal input index;
  signal output out;

  var middle;

  middle = index & 1;

  out <-- middle;

  log(index);
  log(out);
}

component main {public [index]} = Test();
