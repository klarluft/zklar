pragma solidity ^0.8.0;

/**
 * @title Elliptic curve operations on twist points for alt_bn128
 * @author Mustafa Al-Bassam (mus@musalbas.com)
 * @dev Homepage: https://github.com/musalbas/solidity-BN256G2
 */

library BN256G2 {
    uint256 internal constant FIELD_MODULUS = 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47;
    uint256 internal constant TWISTBX = 0x2b149d40ceb8aaae81be18991be06ac3b5b4c5e559dbefa33267e6dc24a138e5;
    uint256 internal constant TWISTBY = 0x9713b03af0fed4cd2cafadeed8fdf4a74fa084e52d1852e4a2bd0685c315d2;
    uint internal constant PTXX = 0;
    uint internal constant PTXY = 1;
    uint internal constant PTYX = 2;
    uint internal constant PTYY = 3;
    uint internal constant PTZX = 4;
    uint internal constant PTZY = 5;

    /**
     * @notice Add two twist points
     * @param pt1xx Coefficient 1 of x on point 1
     * @param pt1xy Coefficient 2 of x on point 1
     * @param pt1yx Coefficient 1 of y on point 1
     * @param pt1yy Coefficient 2 of y on point 1
     * @param pt2xx Coefficient 1 of x on point 2
     * @param pt2xy Coefficient 2 of x on point 2
     * @param pt2yx Coefficient 1 of y on point 2
     * @param pt2yy Coefficient 2 of y on point 2
     * @return (pt3xx, pt3xy, pt3yx, pt3yy)
     */
    function ECTwistAdd(
        uint256 pt1xx, uint256 pt1xy,
        uint256 pt1yx, uint256 pt1yy,
        uint256 pt2xx, uint256 pt2xy,
        uint256 pt2yx, uint256 pt2yy
    ) public view returns (
        uint256, uint256,
        uint256, uint256
    ) {
        if (
            pt1xx == 0 && pt1xy == 0 &&
            pt1yx == 0 && pt1yy == 0
        ) {
            if (!(
                pt2xx == 0 && pt2xy == 0 &&
                pt2yx == 0 && pt2yy == 0
            )) {
                assert(_isOnCurve(
                    pt2xx, pt2xy,
                    pt2yx, pt2yy
                ));
            }
            return (
                pt2xx, pt2xy,
                pt2yx, pt2yy
            );
        } else if (
            pt2xx == 0 && pt2xy == 0 &&
            pt2yx == 0 && pt2yy == 0
        ) {
            assert(_isOnCurve(
                pt1xx, pt1xy,
                pt1yx, pt1yy
            ));
            return (
                pt1xx, pt1xy,
                pt1yx, pt1yy
            );
        }

        assert(_isOnCurve(
            pt1xx, pt1xy,
            pt1yx, pt1yy
        ));
        assert(_isOnCurve(
            pt2xx, pt2xy,
            pt2yx, pt2yy
        ));

        uint256[6] memory pt3 = _ECTwistAddJacobian(
            pt1xx, pt1xy,
            pt1yx, pt1yy,
            1,     0,
            pt2xx, pt2xy,
            pt2yx, pt2yy,
            1,     0
        );

        return _fromJacobian(
            pt3[PTXX], pt3[PTXY],
            pt3[PTYX], pt3[PTYY],
            pt3[PTZX], pt3[PTZY]
        );
    }

    /**
     * @notice Multiply a twist point by a scalar
     * @param s     Scalar to multiply by
     * @param pt1xx Coefficient 1 of x
     * @param pt1xy Coefficient 2 of x
     * @param pt1yx Coefficient 1 of y
     * @param pt1yy Coefficient 2 of y
     * @return (pt2xx, pt2xy, pt2yx, pt2yy)
     */
    function ECTwistMul(
        uint256 s,
        uint256 pt1xx, uint256 pt1xy,
        uint256 pt1yx, uint256 pt1yy
    ) public view returns (
        uint256, uint256,
        uint256, uint256
    ) {
        uint256 pt1zx = 1;
        if (
            pt1xx == 0 && pt1xy == 0 &&
            pt1yx == 0 && pt1yy == 0
        ) {
            pt1xx = 1;
            pt1yx = 1;
            pt1zx = 0;
        } else {
            assert(_isOnCurve(
                pt1xx, pt1xy,
                pt1yx, pt1yy
            ));
        }

        uint256[6] memory pt2 = _ECTwistMulJacobian(
            s,
            pt1xx, pt1xy,
            pt1yx, pt1yy,
            pt1zx, 0
        );

        return _fromJacobian(
            pt2[PTXX], pt2[PTXY],
            pt2[PTYX], pt2[PTYY],
            pt2[PTZX], pt2[PTZY]
        );
    }

    /**
     * @notice Get the field modulus
     * @return The field modulus
     */
    function GetFieldModulus() public pure returns (uint256) {
        return FIELD_MODULUS;
    }

    function submod(uint256 a, uint256 b, uint256 n) internal pure returns (uint256) {
        return addmod(a, n - b, n);
    }

    function _FQ2Mul(
        uint256 xx, uint256 xy,
        uint256 yx, uint256 yy
    ) internal pure returns (uint256, uint256) {
        return (
            submod(mulmod(xx, yx, FIELD_MODULUS), mulmod(xy, yy, FIELD_MODULUS), FIELD_MODULUS),
            addmod(mulmod(xx, yy, FIELD_MODULUS), mulmod(xy, yx, FIELD_MODULUS), FIELD_MODULUS)
        );
    }

    function _FQ2Muc(
        uint256 xx, uint256 xy,
        uint256 c
    ) internal pure returns (uint256, uint256) {
        return (
            mulmod(xx, c, FIELD_MODULUS),
            mulmod(xy, c, FIELD_MODULUS)
        );
    }

    function _FQ2Add(
        uint256 xx, uint256 xy,
        uint256 yx, uint256 yy
    ) internal pure returns (uint256, uint256) {
        return (
            addmod(xx, yx, FIELD_MODULUS),
            addmod(xy, yy, FIELD_MODULUS)
        );
    }

    function _FQ2Sub(
        uint256 xx, uint256 xy,
        uint256 yx, uint256 yy
    ) internal pure returns (uint256 rx, uint256 ry) {
        return (
            submod(xx, yx, FIELD_MODULUS),
            submod(xy, yy, FIELD_MODULUS)
        );
    }

    function _FQ2Div(
        uint256 xx, uint256 xy,
        uint256 yx, uint256 yy
    ) internal view returns (uint256, uint256) {
        (yx, yy) = _FQ2Inv(yx, yy);
        return _FQ2Mul(xx, xy, yx, yy);
    }

    function _FQ2Inv(uint256 x, uint256 y) internal view returns (uint256, uint256) {
        uint256 inv = _modInv(addmod(mulmod(y, y, FIELD_MODULUS), mulmod(x, x, FIELD_MODULUS), FIELD_MODULUS), FIELD_MODULUS);
        return (
            mulmod(x, inv, FIELD_MODULUS),
            FIELD_MODULUS - mulmod(y, inv, FIELD_MODULUS)
        );
    }

    function _isOnCurve(
        uint256 xx, uint256 xy,
        uint256 yx, uint256 yy
    ) internal pure returns (bool) {
        uint256 yyx;
        uint256 yyy;
        uint256 xxxx;
        uint256 xxxy;
        (yyx, yyy) = _FQ2Mul(yx, yy, yx, yy);
        (xxxx, xxxy) = _FQ2Mul(xx, xy, xx, xy);
        (xxxx, xxxy) = _FQ2Mul(xxxx, xxxy, xx, xy);
        (yyx, yyy) = _FQ2Sub(yyx, yyy, xxxx, xxxy);
        (yyx, yyy) = _FQ2Sub(yyx, yyy, TWISTBX, TWISTBY);
        return yyx == 0 && yyy == 0;
    }

    function _modInv(uint256 a, uint256 n) internal view returns (uint256 result) {
        bool success;
        assembly {
            let freemem := mload(0x40)
            mstore(freemem, 0x20)
            mstore(add(freemem,0x20), 0x20)
            mstore(add(freemem,0x40), 0x20)
            mstore(add(freemem,0x60), a)
            mstore(add(freemem,0x80), sub(n, 2))
            mstore(add(freemem,0xA0), n)
            success := staticcall(sub(gas(), 2000), 5, freemem, 0xC0, freemem, 0x20)
            result := mload(freemem)
        }
        require(success);
    }

    function _fromJacobian(
        uint256 pt1xx, uint256 pt1xy,
        uint256 pt1yx, uint256 pt1yy,
        uint256 pt1zx, uint256 pt1zy
    ) internal view returns (
        uint256 pt2xx, uint256 pt2xy,
        uint256 pt2yx, uint256 pt2yy
    ) {
        uint256 invzx;
        uint256 invzy;
        (invzx, invzy) = _FQ2Inv(pt1zx, pt1zy);
        (pt2xx, pt2xy) = _FQ2Mul(pt1xx, pt1xy, invzx, invzy);
        (pt2yx, pt2yy) = _FQ2Mul(pt1yx, pt1yy, invzx, invzy);
    }

    function _ECTwistAddJacobian(
        uint256 pt1xx, uint256 pt1xy,
        uint256 pt1yx, uint256 pt1yy,
        uint256 pt1zx, uint256 pt1zy,
        uint256 pt2xx, uint256 pt2xy,
        uint256 pt2yx, uint256 pt2yy,
        uint256 pt2zx, uint256 pt2zy) internal pure returns (uint256[6] memory pt3) {
            if (pt1zx == 0 && pt1zy == 0) {
                (
                    pt3[PTXX], pt3[PTXY],
                    pt3[PTYX], pt3[PTYY],
                    pt3[PTZX], pt3[PTZY]
                ) = (
                    pt2xx, pt2xy,
                    pt2yx, pt2yy,
                    pt2zx, pt2zy
                );
                return pt3;
            } else if (pt2zx == 0 && pt2zy == 0) {
                (
                    pt3[PTXX], pt3[PTXY],
                    pt3[PTYX], pt3[PTYY],
                    pt3[PTZX], pt3[PTZY]
                ) = (
                    pt1xx, pt1xy,
                    pt1yx, pt1yy,
                    pt1zx, pt1zy
                );
                return pt3;
            }

            (pt2yx,     pt2yy)     = _FQ2Mul(pt2yx, pt2yy, pt1zx, pt1zy); // U1 = y2 * z1
            (pt3[PTYX], pt3[PTYY]) = _FQ2Mul(pt1yx, pt1yy, pt2zx, pt2zy); // U2 = y1 * z2
            (pt2xx,     pt2xy)     = _FQ2Mul(pt2xx, pt2xy, pt1zx, pt1zy); // V1 = x2 * z1
            (pt3[PTZX], pt3[PTZY]) = _FQ2Mul(pt1xx, pt1xy, pt2zx, pt2zy); // V2 = x1 * z2

            if (pt2xx == pt3[PTZX] && pt2xy == pt3[PTZY]) {
                if (pt2yx == pt3[PTYX] && pt2yy == pt3[PTYY]) {
                    (
                        pt3[PTXX], pt3[PTXY],
                        pt3[PTYX], pt3[PTYY],
                        pt3[PTZX], pt3[PTZY]
                    ) = _ECTwistDoubleJacobian(pt1xx, pt1xy, pt1yx, pt1yy, pt1zx, pt1zy);
                    return pt3;
                }
                (
                    pt3[PTXX], pt3[PTXY],
                    pt3[PTYX], pt3[PTYY],
                    pt3[PTZX], pt3[PTZY]
                ) = (
                    1, 0,
                    1, 0,
                    0, 0
                );
                return pt3;
            }

            (pt2zx,     pt2zy)     = _FQ2Mul(pt1zx, pt1zy, pt2zx,     pt2zy);     // W = z1 * z2
            (pt1xx,     pt1xy)     = _FQ2Sub(pt2yx, pt2yy, pt3[PTYX], pt3[PTYY]); // U = U1 - U2
            (pt1yx,     pt1yy)     = _FQ2Sub(pt2xx, pt2xy, pt3[PTZX], pt3[PTZY]); // V = V1 - V2
            (pt1zx,     pt1zy)     = _FQ2Mul(pt1yx, pt1yy, pt1yx,     pt1yy);     // V_squared = V * V
            (pt2yx,     pt2yy)     = _FQ2Mul(pt1zx, pt1zy, pt3[PTZX], pt3[PTZY]); // V_squared_times_V2 = V_squared * V2
            (pt1zx,     pt1zy)     = _FQ2Mul(pt1zx, pt1zy, pt1yx,     pt1yy);     // V_cubed = V * V_squared
            (pt3[PTZX], pt3[PTZY]) = _FQ2Mul(pt1zx, pt1zy, pt2zx,     pt2zy);     // newz = V_cubed * W
            (pt2xx,     pt2xy)     = _FQ2Mul(pt1xx, pt1xy, pt1xx,     pt1xy);     // U * U
            (pt2xx,     pt2xy)     = _FQ2Mul(pt2xx, pt2xy, pt2zx,     pt2zy);     // U * U * W
            (pt2xx,     pt2xy)     = _FQ2Sub(pt2xx, pt2xy, pt1zx,     pt1zy);     // U * U * W - V_cubed
            (pt2zx,     pt2zy)     = _FQ2Muc(pt2yx, pt2yy, 2);                    // 2 * V_squared_times_V2
            (pt2xx,     pt2xy)     = _FQ2Sub(pt2xx, pt2xy, pt2zx,     pt2zy);     // A = U * U * W - V_cubed - 2 * V_squared_times_V2
            (pt3[PTXX], pt3[PTXY]) = _FQ2Mul(pt1yx, pt1yy, pt2xx,     pt2xy);     // newx = V * A
            (pt1yx,     pt1yy)     = _FQ2Sub(pt2yx, pt2yy, pt2xx,     pt2xy);     // V_squared_times_V2 - A
            (pt1yx,     pt1yy)     = _FQ2Mul(pt1xx, pt1xy, pt1yx,     pt1yy);     // U * (V_squared_times_V2 - A)
            (pt1xx,     pt1xy)     = _FQ2Mul(pt1zx, pt1zy, pt3[PTYX], pt3[PTYY]); // V_cubed * U2
            (pt3[PTYX], pt3[PTYY]) = _FQ2Sub(pt1yx, pt1yy, pt1xx,     pt1xy);     // newy = U * (V_squared_times_V2 - A) - V_cubed * U2
    }

    function _ECTwistDoubleJacobian(
        uint256 pt1xx, uint256 pt1xy,
        uint256 pt1yx, uint256 pt1yy,
        uint256 pt1zx, uint256 pt1zy
    ) internal pure returns (
        uint256 pt2xx, uint256 pt2xy,
        uint256 pt2yx, uint256 pt2yy,
        uint256 pt2zx, uint256 pt2zy
    ) {
        (pt2xx, pt2xy) = _FQ2Muc(pt1xx, pt1xy, 3);            // 3 * x
        (pt2xx, pt2xy) = _FQ2Mul(pt2xx, pt2xy, pt1xx, pt1xy); // W = 3 * x * x
        (pt1zx, pt1zy) = _FQ2Mul(pt1yx, pt1yy, pt1zx, pt1zy); // S = y * z
        (pt2yx, pt2yy) = _FQ2Mul(pt1xx, pt1xy, pt1yx, pt1yy); // x * y
        (pt2yx, pt2yy) = _FQ2Mul(pt2yx, pt2yy, pt1zx, pt1zy); // B = x * y * S
        (pt1xx, pt1xy) = _FQ2Mul(pt2xx, pt2xy, pt2xx, pt2xy); // W * W
        (pt2zx, pt2zy) = _FQ2Muc(pt2yx, pt2yy, 8);            // 8 * B
        (pt1xx, pt1xy) = _FQ2Sub(pt1xx, pt1xy, pt2zx, pt2zy); // H = W * W - 8 * B
        (pt2zx, pt2zy) = _FQ2Mul(pt1zx, pt1zy, pt1zx, pt1zy); // S_squared = S * S
        (pt2yx, pt2yy) = _FQ2Muc(pt2yx, pt2yy, 4);            // 4 * B
        (pt2yx, pt2yy) = _FQ2Sub(pt2yx, pt2yy, pt1xx, pt1xy); // 4 * B - H
        (pt2yx, pt2yy) = _FQ2Mul(pt2yx, pt2yy, pt2xx, pt2xy); // W * (4 * B - H)
        (pt2xx, pt2xy) = _FQ2Muc(pt1yx, pt1yy, 8);            // 8 * y
        (pt2xx, pt2xy) = _FQ2Mul(pt2xx, pt2xy, pt1yx, pt1yy); // 8 * y * y
        (pt2xx, pt2xy) = _FQ2Mul(pt2xx, pt2xy, pt2zx, pt2zy); // 8 * y * y * S_squared
        (pt2yx, pt2yy) = _FQ2Sub(pt2yx, pt2yy, pt2xx, pt2xy); // newy = W * (4 * B - H) - 8 * y * y * S_squared
        (pt2xx, pt2xy) = _FQ2Muc(pt1xx, pt1xy, 2);            // 2 * H
        (pt2xx, pt2xy) = _FQ2Mul(pt2xx, pt2xy, pt1zx, pt1zy); // newx = 2 * H * S
        (pt2zx, pt2zy) = _FQ2Mul(pt1zx, pt1zy, pt2zx, pt2zy); // S * S_squared
        (pt2zx, pt2zy) = _FQ2Muc(pt2zx, pt2zy, 8);            // newz = 8 * S * S_squared
    }

    function _ECTwistMulJacobian(
        uint256 d,
        uint256 pt1xx, uint256 pt1xy,
        uint256 pt1yx, uint256 pt1yy,
        uint256 pt1zx, uint256 pt1zy
    ) internal pure returns (uint256[6] memory pt2) {
        while (d != 0) {
            if ((d & 1) != 0) {
                pt2 = _ECTwistAddJacobian(
                    pt2[PTXX], pt2[PTXY],
                    pt2[PTYX], pt2[PTYY],
                    pt2[PTZX], pt2[PTZY],
                    pt1xx, pt1xy,
                    pt1yx, pt1yy,
                    pt1zx, pt1zy);
            }
            (
                pt1xx, pt1xy,
                pt1yx, pt1yy,
                pt1zx, pt1zy
            ) = _ECTwistDoubleJacobian(
                pt1xx, pt1xy,
                pt1yx, pt1yy,
                pt1zx, pt1zy
            );

            d = d / 2;
        }
    }
}
// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() pure internal returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() pure internal returns (G2Point memory) {
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
    }
    /// @return the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) pure internal returns (G1Point memory) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
    }
    /// @return r the sum of two points of G2
    function addition(G2Point memory p1, G2Point memory p2) internal view returns (G2Point memory r) {
        (r.X[0], r.X[1], r.Y[0], r.Y[1]) = BN256G2.ECTwistAdd(p1.X[0],p1.X[1],p1.Y[0],p1.Y[1],p2.X[0],p2.X[1],p2.Y[0],p2.Y[1]);
    }
    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success);
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length);
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[1];
            input[i * 6 + 3] = p2[i].X[0];
            input[i * 6 + 4] = p2[i].Y[1];
            input[i * 6 + 5] = p2[i].Y[0];
        }
        uint[1] memory out;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}

contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    struct Proof {
        Pairing.G1Point a;
        Pairing.G2Point b;
        Pairing.G1Point c;
    }
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x0d153954c9d4223d198fb7f9d92a9347024fc75dafd820928e9bf8f766b7680f), uint256(0x185e633fcda43362ef82a903b0333e19f935749ead9d5fc988f51b024fc04686));
        vk.beta = Pairing.G2Point([uint256(0x1cbfcdded3c4eb27d1de65de5bc780c9aa086dee9be9f704ec5f622757a8648e), uint256(0x1ce7da9e69d5d2dde4ca78d8770b71b0355da7aebd288e0195c400ddbeb165ae)], [uint256(0x1b4502e2567df83f2c88d6146b536638960dd39d21f1cb52d716aad040d6af30), uint256(0x06fb7f7a061789e8fe37c9eac56ea233e8b5ed01c42f90864065354019e713f1)]);
        vk.gamma = Pairing.G2Point([uint256(0x18d3d9f2d83117d4bdffd21430a58a09bed64dceccdefd773f5e62bb4e9bcfbb), uint256(0x077698e05d18095c6b26e143d28eba6fce83be42903fd66d0dc8d6c77a372caf)], [uint256(0x2d7844512a74082ac437dcbe1d3c02013efb6568b4429c72f622a491da5405a2), uint256(0x2b4377a297b184240168662c16e90cc524a6bd41b3dab120af92dd7fef37d53b)]);
        vk.delta = Pairing.G2Point([uint256(0x0d4e1d6290fce0dfca009fbd9e5c1338aa4944f7928e360614d0ca6ecbb6204d), uint256(0x1f3510686e0e21046d24eb50c84b396e2694a004d61678e2512a9324c974de85)], [uint256(0x02adfe1382f66ee77ce0f3f6d3a581219c2a7d48d6156ea6e604c06a17b7d7bc), uint256(0x19015a2f7cde36030a9a2bab3f9aca07802d534ee5b21b8cd5cddf062e089414)]);
        vk.gamma_abc = new Pairing.G1Point[](39);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x15a3eb93addfc4cc2aa1b20c7ede87547beb77b456dd292fedb5a04efc7b841f), uint256(0x008e7d2a287ebb8de84f0762444cb4156bd6f345ca402d40bd96903ea58bb1a0));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x29e98453b068ceecb6effe82146a836a0edcb93312464bd2cf171aafb145d8e0), uint256(0x2fe26c15bfd31717c8ab1d525797c370e8c280ae2ec5b94e67bc7c27993f45b3));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x238b5ebb090cf4fc41c71ef18955bd1f3f185eead23775a7cc355f5813a20908), uint256(0x257e972d6b7c60dca084d4d03a95268433ad9e1dfd0c1a8264adb8c4becc26c9));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x0541c7b0412d53a34283b41902ac5416448195fa3c41aaa647fb889df4576f1f), uint256(0x296aeeee71109a43602fb3cc727a82aedc962efdbf4bd3e1d8afed303fe53393));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x2209a91ed428072712a5660ebed4eca1309c12b3835f2a5eeafadfa05ca33c20), uint256(0x1da4ea00141852ef7c1d113b5b3e559db8aad49b536a17f32dc910ea0c1969eb));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x15044007e7336e540468aab19c03242d5161eff97ce958c6f793687f0690b80e), uint256(0x1fc9ff39b80f37a75464b358028a042ae5e828170fc74392e72134490043e791));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x2a3017ea21d456f2b145ba0ea7feeef9af56cce24f864268abdd0ef1c24036d1), uint256(0x10aa83a2ee115d6bfddbf4c7dfd605e290c27310b455f4b5dc13b27a7b973bb8));
        vk.gamma_abc[7] = Pairing.G1Point(uint256(0x03615ec6cc9ade15d97c1fb065095df78b27f8d3c2bcf1775ece3027da78b1ec), uint256(0x2de4af936febe5d1e748e9969db053b104442df3d5b9da24088093edf9f4342a));
        vk.gamma_abc[8] = Pairing.G1Point(uint256(0x06727baa12ee49e9d845da146bbfb335fb4d521daa001349164a5985fe42696f), uint256(0x27645d34be63eac6e7c1a1da951bd829558e1d6497cc66a3887a25570e72c990));
        vk.gamma_abc[9] = Pairing.G1Point(uint256(0x2225b5a059c1e48d25043f3eabbc40e2701374b253673bc1956e898636e1a0d6), uint256(0x0dd7b2388a534f825666afb86bdf3431b323aac17bdcf628e8ee8562c071749d));
        vk.gamma_abc[10] = Pairing.G1Point(uint256(0x29abd461aeb4674695f8ea49613df3822c93c5389b92354060019ce6620c3f54), uint256(0x0a425bd9206514a993f4fd71ae2a55c644b09b382bce192728875d2e3f04db2f));
        vk.gamma_abc[11] = Pairing.G1Point(uint256(0x2d012f5c4362260509815b86efda63c82069b4e427bac86d745d21a21895d6be), uint256(0x1ef942b1a806cf243e45b8a38888a37a24391faa94469d2f458d02bdd61142c0));
        vk.gamma_abc[12] = Pairing.G1Point(uint256(0x0b6373a83118924c76848149c299e05ac3c33e0afb5463bad5751444e6dc7200), uint256(0x21640b58d8a3e2be7bc99819b979085959b04c58c1276c7fdcff519e70f8a857));
        vk.gamma_abc[13] = Pairing.G1Point(uint256(0x173d5946523db6f8b0745df715983aee23f4f7a434ab19373e19fb73c02480a6), uint256(0x276c61c86e83e30a548c7bdd2bc0c15d6a798868c2aa85d8435f837fd787b17b));
        vk.gamma_abc[14] = Pairing.G1Point(uint256(0x1fffb3db56b0af03b9e736b3372c192b686c2c06ccf03297954e79f42de03492), uint256(0x201fe9efd87925fec58dff492b60554af7a7351d2a5bf6667f8aa305b15d7eb2));
        vk.gamma_abc[15] = Pairing.G1Point(uint256(0x2fb6f918b8dbec28391108ab3ee4856def7329b1ebf18ee6d8698da7a79e4c85), uint256(0x186c890d9c54cda64b7adc766eb9781d9f9a3d2d2531c581d0eb9e7425a5b010));
        vk.gamma_abc[16] = Pairing.G1Point(uint256(0x16da8e279adb56846567b780c5c3bdfddd1bacbb1047af52f2326d03d46c2d62), uint256(0x17dbdd6f537235ea6657f38d6868223e25a061dfad07d64b07065786630e829a));
        vk.gamma_abc[17] = Pairing.G1Point(uint256(0x15c6e6ce89277685c225f02f809908a2b9d8e6461c7212841147d8fb8551a10c), uint256(0x013b1d20c38b6f7d5b587e94c50ba4731eee4f8f1a407d099316a3bcfd95db42));
        vk.gamma_abc[18] = Pairing.G1Point(uint256(0x013900cf957df300af891de6e630a9f9358822c6a48fe72733574151f103a02e), uint256(0x2420fc20cd44bca3c086652bf168d39e0e1f360c8505de2ba03b0694186e6fe1));
        vk.gamma_abc[19] = Pairing.G1Point(uint256(0x2e2c0f8268db41539e8193b9052884129206b5ab239b87a1342f82f22f0b8fa7), uint256(0x17d0a0149064fd95dee166dc0e8a01a3f419d340d844fc38f1de3e2319f6403a));
        vk.gamma_abc[20] = Pairing.G1Point(uint256(0x269153c345353c77c3c92bf27f122259a8bff83dc342603c7cfa2b5cb4348cdd), uint256(0x1fcb980b4a3be845af49863c487429ed0c1b21ef9b7a47162485169fc5fdfa7e));
        vk.gamma_abc[21] = Pairing.G1Point(uint256(0x0fd7e07181a272a51ca8bd4edd699c57b713ca2ab0187c5dd095ddd9a12c82db), uint256(0x129c87110c9ba823ea9bafbbd4ccc682d77268b22192fded13d9339cbbd06892));
        vk.gamma_abc[22] = Pairing.G1Point(uint256(0x26c4fd989a9bd5bc4ae14a2dd4f85408483318921e4f262cb55718c575609c21), uint256(0x1315538c71d69e8fa919ae37866f27462b9ecd8026deac637cf20abc331827e2));
        vk.gamma_abc[23] = Pairing.G1Point(uint256(0x2dba2aeed2d01fb25f4cec1901bac9fc9587677248e2484b006e05454ecc4b2d), uint256(0x23bd38cb3e6d5eb55aad1c0adfc5b01427bdb2bc70a9ee868095a005dd92c78f));
        vk.gamma_abc[24] = Pairing.G1Point(uint256(0x1a6bab50486b8c668c20073d5340b726b8b9b0534721b4dfe0c53de5438b1624), uint256(0x281ed6831ca55c44892f9b5e1b9a4bfd4e873c919f31e24ffe43b83198237a35));
        vk.gamma_abc[25] = Pairing.G1Point(uint256(0x233f0ed32b3db6951fada99147787deff85701593891af679eef9fcce076ec35), uint256(0x180b478fe6bf05c507f8ee66d498f1d9f7aab8e9c5f3741a2950e76997d4b330));
        vk.gamma_abc[26] = Pairing.G1Point(uint256(0x2187f99be74e279a5f4707f0f5a2a7fb72be045bce05c686371d04bac9170c91), uint256(0x254a7743fc0cb29b50e1ef599599210b3eb724403e9d08ecba9a49cf7bce743e));
        vk.gamma_abc[27] = Pairing.G1Point(uint256(0x2cbe4332fa25702c101d5d60e3cfac16ab0a880c855fb4ff3fae2acbb72d10b7), uint256(0x0a5b18dcdb299cdbe2b36581cdb54041bb6f505bb724e746ad5eb6346db09d9e));
        vk.gamma_abc[28] = Pairing.G1Point(uint256(0x1961f2e17c5b651fd7938be8ce9d5f6725e95cfe70850a25ebd1e36b83c4275d), uint256(0x025ed03ee2bf03c43af5fed60749125e6d51d5f878c71762b1d1d61b43611e4a));
        vk.gamma_abc[29] = Pairing.G1Point(uint256(0x207feb1057eb98f4621b93506babf9c1267d1045c14643665b2192bfc9e1a680), uint256(0x0b709108b68647feb2d0ee5576c5aac6b4f821df0286d7464c006ba968f77dae));
        vk.gamma_abc[30] = Pairing.G1Point(uint256(0x0072a95b45be34ebbef716472c44662fcc85393ba91226c71d349594db374498), uint256(0x1ad3c9ca6b622eba466f6467fa6c02fee51d791c421e78f6c3a4e99f2da8dd44));
        vk.gamma_abc[31] = Pairing.G1Point(uint256(0x162d9f9a1b172aef96730fbfe18984067ceb1f2554496c8418ea861a87f60661), uint256(0x1274d8f6a83bd552961285b0f91bab3979133f453dbdbc766917b4917c626327));
        vk.gamma_abc[32] = Pairing.G1Point(uint256(0x162b3989c4e106ce5f1a28ef11ed2a0c37794a605c15e141347ffe12d55dc973), uint256(0x1756d9e324a11f4bdd0c3be81b3a164f7078dff2c8c0886e870276aac1601101));
        vk.gamma_abc[33] = Pairing.G1Point(uint256(0x13995dacc22909b93ee230aec76e41832fb84436b1aac3bddc3e71b3f937f37f), uint256(0x2e2b7515a532d65f7f58e0897915074310206d7ba429ae5ca2782a9d9a071daa));
        vk.gamma_abc[34] = Pairing.G1Point(uint256(0x0ec87dde22323451de466881ae6ac54478e2b0e2582ca62d02df498f2d0f5816), uint256(0x0ccc1d76b9fb558f8b58b3331a8e682e708cab793226fa7baa4e1e7710b60d02));
        vk.gamma_abc[35] = Pairing.G1Point(uint256(0x27b3e70694d92b6f4e133b55a04d2e8e9c209a99e68e3899d1fc00066d8ccf8f), uint256(0x039ded0cce62e398453f25aec834aca589df05f6e2ed88b86191dc79e23fcf51));
        vk.gamma_abc[36] = Pairing.G1Point(uint256(0x03d6ec5e64f436b2bcec9f8429c09186babdb8f0fc1765d7f01a6fbd86adb993), uint256(0x2700ba06700c4171321ff5f652d8c1dd864950e85bc9330efbde1ddb919db259));
        vk.gamma_abc[37] = Pairing.G1Point(uint256(0x0ada592eaa146823c4daa062f505b20fbd27c224759d61ce6c12ec92530b9162), uint256(0x02fb6d71d96535c63fe33f5e5b09289bce3803161a82d8ae394d2ef468f2fe7b));
        vk.gamma_abc[38] = Pairing.G1Point(uint256(0x1ed75a2f683aac9fdbfd935aa735f47bed10155645349a10d74eae3339b1fd6e), uint256(0x0a0a77db47fadf906a03f994a88350128acfd29c30b388f5d24fbd0ce88e5643));
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.gamma_abc.length);
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field);
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.gamma_abc[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.gamma_abc[0]);
        if(!Pairing.pairingProd4(
             proof.a, proof.b,
             Pairing.negate(vk_x), vk.gamma,
             Pairing.negate(proof.c), vk.delta,
             Pairing.negate(vk.alpha), vk.beta)) return 1;
        return 0;
    }
    function verifyTx(
            Proof memory proof, uint[38] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](38);
        
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
