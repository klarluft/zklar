// SPDX-License-Identifier: LGPL-3.0-only
// This file is LGPL3 Licensed
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

contract UpdateVerifierContract {
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
        vk.alpha = Pairing.G1Point(uint256(0x2d9714214c5b2cb7193f1f0552e5d8e48bbcfdbeec7897b161c4a16dc31ea14d), uint256(0x1f290a079c70f35ba1f655a045607d9ec4b62b01bbb9862f0c7f3a73bbcba8fe));
        vk.beta = Pairing.G2Point([uint256(0x26d7fe33530d8a8545230eb1c5d86965d05b6910f830201280b6e13605811654), uint256(0x18d24d62fbddc1f41070ba20767b72999e79d58563176f972ee517dfd398e2a7)], [uint256(0x232202d457cc042d041e1403c58d0caa72c5f6fddd30344db4368e31f0377a0a), uint256(0x16957192f1ad551995c355ec0d626444dfca26c180a3541bcee2fff480ea9a57)]);
        vk.gamma = Pairing.G2Point([uint256(0x1c4aea4d86357a476ba9b07dfd3462535156b62316363dfc67bd40ab60e6f997), uint256(0x0ebd8a34073e4b92804d01aae96255790137a50f34a8a6ae59618e9a97a5e35c)], [uint256(0x2c40f26343b45473a60a356e1124012b3d1a7a1597329ce86b3760c7921c4192), uint256(0x1720ec77a8b253ced71c3149591887105ce6fbcc8a376efde702efc8e9d2e456)]);
        vk.delta = Pairing.G2Point([uint256(0x149aa0518a4f9f672e86dc41e0af25f16b0689a241a11fc2f74643efea4bf663), uint256(0x2f0e546574adcf6149a6f6aafcd29a562f2396a0b2d6f392c1a155bca1f44d55)], [uint256(0x0e1fdc60d2ebf9379abd769c361d36a520a54eda374ba318334c4b8461a68c11), uint256(0x07fd84ff5b0a84847b8288e325763fa1746cda6804c813712bad0530eef560fa)]);
        vk.gamma_abc = new Pairing.G1Point[](39);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x1abc72a814ad4dcc0e564edfcda6193715dab2b81fd02d2bb70e29af933be1df), uint256(0x1d30d376a7a42de5700b668acf2103ee522c3c7a9777c826e4ee91d1078f63c1));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x18487fc86dce1942bb25a0d955ba7d32e63995e14801e07587f446207bd87e6b), uint256(0x28898ba99695697683fa025a4ee1f95f4720710e4b3ef0551a84f2ffa512fb27));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x195d81c2df0a89524d40aefba3befae12938b9e122a85e212ef8fc44a5114ad1), uint256(0x26b75d2afd1e87c432c1016e7d20d53c7f65d1f2e64631038312784d10096682));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x0d6fb18a7ab422f28ee459c6728c1aed711337e7ebd665b91718274e81771f0e), uint256(0x0b099c336e388708692cca31f4e2dd6b7d904d646847b7d8379e9938dcb309da));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x2c745447ee279a0ed3288872205158e33fc24f21eafe132950a83bba467aa64f), uint256(0x06be8490f327a90cc14ad2353bd1baa81802fdb5363dd6ccf0e49fa85ef8e9c2));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x1b5eb87c6b08c19f4f0358cdaa5dfb9ee84f3deb94b378fc4c113ec430f3c167), uint256(0x18e0f6a4948e84502d936779bcabe0821ce69353f89d5128d8db1e0ddf7c8269));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x2d299c01fd16db473c48aec5c650e9eabb8fc0ab18f01ed4790f6f886af07063), uint256(0x25b4b357aa6ca4e0d3c48df4838486cf9154afdc48bc2c6e2bb63cb57099c840));
        vk.gamma_abc[7] = Pairing.G1Point(uint256(0x2edac56adfede1d197df84f357d77ac1db6c33c365df6a3f012beaef935f585d), uint256(0x1bd31aa1c87690c61886e44ab6ec1ecd62419628d9f84eef4f0e292c6e04a1ac));
        vk.gamma_abc[8] = Pairing.G1Point(uint256(0x00ea2aaa2ef1e9711dd1310aa9e0d472c5ffc4e1b74d5698b76ab809fa6c071a), uint256(0x1b1144f12e45597f93c2690ac54bc6196295f7ef285424b7afba7beb33cb30b8));
        vk.gamma_abc[9] = Pairing.G1Point(uint256(0x3063f1bb8e8a9cc1f1e0da00ce6e5ad1c2832ceeb09db9db12508ea816e25a05), uint256(0x2044568b3959c750b4acfa787fbed9599f90f2d60cda25de23d7bd3ff9961904));
        vk.gamma_abc[10] = Pairing.G1Point(uint256(0x136f1069541dfb65c816171118f36e6a72e23376d9fa4949bd4f94315577a87f), uint256(0x2d08225ee19b3a63f1e09d8c195e9db3960551e16a6af636db2ba99677ad8265));
        vk.gamma_abc[11] = Pairing.G1Point(uint256(0x1dc6c4d1305d7369a30cdd2559ef34c11b9c110a43e843b25da6b4cf76f1f04d), uint256(0x14d1532c57b0b4424e1b7ff1d101522617aba0a1b0ebcbd72e1f91f6bb1081e6));
        vk.gamma_abc[12] = Pairing.G1Point(uint256(0x0761fd645b7c3f98e7930c2048286b8053bc007f606d028b7c9e0fd557ac6f76), uint256(0x2207e0922209d02f4816aacd73210b5725fb72436e491c4121cae2b3cd750481));
        vk.gamma_abc[13] = Pairing.G1Point(uint256(0x049c05d7d286f75895ad500a909ca29b56c63181c1f599201b30808ed7abc152), uint256(0x06b2fcf93af473a7640ce58d2ffe244d366d356f16317633a43ec9afe7586dd7));
        vk.gamma_abc[14] = Pairing.G1Point(uint256(0x1883d96a512ba05dd16324203ee397a67fe2143b39935074912dab328594c384), uint256(0x3060887960427ebb898648a79cee6a13df836ed95665c4a9b542f9803ef10139));
        vk.gamma_abc[15] = Pairing.G1Point(uint256(0x212406e8a4c6cbca815d0cf3e0ab63d52f09b864660fd7a11f9b42e81f2f05b8), uint256(0x2e1e73943a9f2590ccf612c5247206fa7459c8fcefa49ad53fb3352afc1f4fb2));
        vk.gamma_abc[16] = Pairing.G1Point(uint256(0x226a31a14973233440ede3df70a3c7cb144699bbb4317e23b0bab9fc4c9122f2), uint256(0x1adde184ea6d363f65481b7cbaf6d632d6ef4a2c218ed1b9840e6e400fe056a6));
        vk.gamma_abc[17] = Pairing.G1Point(uint256(0x251c8d13c678bbfabc17532cdce5c63eaf298a614ec908f75c2a439daf453d7e), uint256(0x2024ffcc670e92b5f268f771135c49940ce408d8723adc8aea6d8cb6de4fb6e1));
        vk.gamma_abc[18] = Pairing.G1Point(uint256(0x0382d0c161aa740c29566583fb7d979a6b6660f99043a4762f1747f40d51dfde), uint256(0x2325190d3f9b3d2cd53b4f9c096ca08cdbbccbe4dfc4337494c086857514dce2));
        vk.gamma_abc[19] = Pairing.G1Point(uint256(0x2df6ce01ccb4c45ea5e98808e9df56564908707a5882c9126324d638324eec07), uint256(0x275a864c98a566344ca330ccc255d25b13a6ea2a83d8dd4d16f76e8f93e51b6a));
        vk.gamma_abc[20] = Pairing.G1Point(uint256(0x01e001cbaf50cf9d090de446a5837cd851974ed702fab462385187e7b17198cc), uint256(0x1a2b43373a12ae72c30aa8a20b9dd2967f4f0f9a4a2835d9035b6283fa339816));
        vk.gamma_abc[21] = Pairing.G1Point(uint256(0x0807eae7bb26b1154b81438d66871a8ffc5214809b0d9c2e13d5b25c8858e371), uint256(0x271c1293d187082c29fd7dff908a3553dc2b329b9c07e558db8419666a6fbdb0));
        vk.gamma_abc[22] = Pairing.G1Point(uint256(0x13c80c920a109710273b229a34048a5235aa6713daa8cf9be7955677e76b7d5c), uint256(0x1a2b81066e9d06234793561de5beba23bac6b42531fd1fa89e03efa780b9de0a));
        vk.gamma_abc[23] = Pairing.G1Point(uint256(0x2df21bfcb40416ba8087ca14f1d6ad8ba1fa75f8a47287067d77b18e525ddc46), uint256(0x022ac4c9fb1e08c28d13708b8f4589b9cbe5f7be9e39a0b4f85a89230f6da017));
        vk.gamma_abc[24] = Pairing.G1Point(uint256(0x300ec932c054876a06f3dfd1c3badc938d6829474b9a7a2bf055197720b03d97), uint256(0x2d70cb9a79456c07470c66d93efee0d1384f864912b5d8d2e7fcd2e437720740));
        vk.gamma_abc[25] = Pairing.G1Point(uint256(0x0cacc430b6863349087d83255f1cbc8ed8306d195ce5bde4c6f7906d9ffc1250), uint256(0x135769ace137bf9e756385274f1e9dd4085fb65f1bb52fde7592aa0bbbf71100));
        vk.gamma_abc[26] = Pairing.G1Point(uint256(0x19741942cfda10d7154ea6ede18bc1116f024fe212330267ace3c230c2f4cba5), uint256(0x204593d8574e3393ead0f151bc73b5041aea23425d99fb1e7b1af75fef63b44f));
        vk.gamma_abc[27] = Pairing.G1Point(uint256(0x1b0efff5c313de2eefc9847e1e9dac4c42f916914253c6b76c689dee79a29614), uint256(0x221b3b402158a3402ef390de759b74656292d8637c72d78d63d4e12efb0aebdf));
        vk.gamma_abc[28] = Pairing.G1Point(uint256(0x061ba29e8fff8b04f12fdc25649bac15f6d34468b608c637def0110dadf05913), uint256(0x09a69a5b319b880075e1c97638a93fa74f20716fe7420a38246f5c76d66724fa));
        vk.gamma_abc[29] = Pairing.G1Point(uint256(0x0dd0fd029ca1420e6adccfe947885c77818d0aa6f37754b36014b8fa840f43ca), uint256(0x02778f0d19f66758951fcead5e3e52984cc254f35b1e1261f9a5109d05c170bc));
        vk.gamma_abc[30] = Pairing.G1Point(uint256(0x1ad046699e94ed18a12d05ef248e6a19c81e6ba6ca26f8bd061b845983ad8807), uint256(0x1d31ca2e15f20c08755f800316178b2e9053615b2f37da39c8b56ee7ec97a3c1));
        vk.gamma_abc[31] = Pairing.G1Point(uint256(0x10cb7fea4a121d10bbc0dd3cc4e431827b093ecbffcc3d397c5c09012636d22d), uint256(0x036dd392a993a3f58aed55d8c82687e8d0bbfc56b707d48173f10dff252e9381));
        vk.gamma_abc[32] = Pairing.G1Point(uint256(0x0b114a411849cdc3c763121e21bf389faa3a7a8fc38281af5040cc11ef4b71bf), uint256(0x1a6d753fb46f7b78f2ff1d807a54a3ae82ec3274737ea8041cc77a2ddcdda9fa));
        vk.gamma_abc[33] = Pairing.G1Point(uint256(0x25caf2cf10058b1c08ce2a145766e54bd866dfeb967946fb8ff2493ad28d6065), uint256(0x12afb27b2636e1d1eadec2ca3078db23b887c8e2dda76ded438a3f77bd9ddba8));
        vk.gamma_abc[34] = Pairing.G1Point(uint256(0x1f01db1499b438b4ca8d5e2bd0bc9db0aabfd42608d12b5e3d51b73141841d0f), uint256(0x122f7edac42e30e1a5055171bb4c7d33acc8e748ebe34bc45cbef02254377c85));
        vk.gamma_abc[35] = Pairing.G1Point(uint256(0x0dffc5b2b0d3b19f1c48ceab6f4974ecd267f321036c1cfa6c3dbbd5d124f237), uint256(0x16664c7981a126f18919c60dbcf36c6ff79d53db3488bd2bf58803dd26182103));
        vk.gamma_abc[36] = Pairing.G1Point(uint256(0x000be8c0ac99fe2ae0a96cd95c9fe14d3163eed906d8991a3df415a186a60b9b), uint256(0x20b9a0f652f03cc785fc3569885c3343ab3aca01e9d61812f68e6b4fb7c323a2));
        vk.gamma_abc[37] = Pairing.G1Point(uint256(0x0dcc224fa5005aff96e661a86e92a2e9bc7415e8397a82e7e31e40dc64d4adcb), uint256(0x00f0f1a1b6c94d1a7af60d90bac54d6c78e1b4e518d1ebfc2dc6ac7847e3d5bd));
        vk.gamma_abc[38] = Pairing.G1Point(uint256(0x201ba9bf0b6d5c442de955e26b3c07e8ba0d42a824ad2ce01c7dc8fad67d55a6), uint256(0x15d5dab01675cbe1d78e42a884fe8dee1d18f6f89e3161ce43d6b30832f82bad));
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
