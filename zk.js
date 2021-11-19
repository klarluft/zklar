// f(x) = (x^3)+(-3*x^2)+(2*x^1)+(0*x^0)
const coefs = [0, 2, -3, 1];
const degree = coefs.length;
const roots = [0, 1, 2, 3];

for (let rootIndex = 0; rootIndex < roots.length; rootIndex++) {
  let result = 0;
  const root = roots[rootIndex];

  for (let degree = 0; degree < coefs.length; degree++) {
    const coef = coefs[degree];
    const part = root ** degree * coef;
    result += part;
  }

  if (result !== 0) {
    console.log("result", result);
  }
}

function pickTargetRoots({ roots }) {}
