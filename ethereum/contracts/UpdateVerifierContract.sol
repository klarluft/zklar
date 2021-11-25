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
        vk.alpha = Pairing.G1Point(uint256(0x11b81eaf4b6ed33c428ebd3f80d71db52f4c005c923e20be456321c610160367), uint256(0x17edc80856ad5cc86535a74d5565a78d67b8648a9a96c4f697966f3de34f47d4));
        vk.beta = Pairing.G2Point([uint256(0x0289e96b7a22478627baace5851c7077d154f9c233b64d9e342386909651f234), uint256(0x136b3081e8c68a12299d4027d9fe7c29290b8edb82647d6a669757c450ebc4bc)], [uint256(0x04a4fb293badad26707f7465b9a3199c5aae503c7c3d9d73cb7fd99922c6b4a0), uint256(0x232405dfb8ef803d6160db091a097fe17dd434dd97c6c8204c5dd44d58d6f8f1)]);
        vk.gamma = Pairing.G2Point([uint256(0x09a66c983e76b2365430a0b9f7583a880f43ea505d17f43de42ea1900c591db2), uint256(0x05605d6495fac7a86565f76d375350ff75f0e4cfe34c72f6c33b5da03c4ca4fe)], [uint256(0x1176c02d617a7755841a4ce32afbed850e7f85b397e9726c8c6551b49239f6e2), uint256(0x072b6468596da1eb491345c698a94603601b64df242362367df7cc83738bc55d)]);
        vk.delta = Pairing.G2Point([uint256(0x1af67b40a7e3bb927b583ddeab826bd148123655715489e7cb0a6a15693c7671), uint256(0x02c2608373b5f52662c49bc3320d000b6db2b3d637ad105e783bf04ab19aecce)], [uint256(0x29c6b3c28fe2e85a60f90d9202da2417e1226c8834c77308e530233a74ba845a), uint256(0x0804e1a8e84197ac88d929621d60e2a7d2d78b5c0d9fc7b34e4025c6dae1e9b1)]);
        vk.gamma_abc = new Pairing.G1Point[](38);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x0baecf1a8def440f5b992816ae2d27779d4e8a5b1a2e0effc92172a22026a865), uint256(0x173f8b73552a72622488b115a0d9802bc42f78c1b0cd43d55ad64e30e639f38a));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x11bdb91d38ed7572479c28579b31aec907fd3d314cfa3a810ce9cb850f560172), uint256(0x1dd0f28149e06225b5bf57a4fdd638c35d4f0de9c5f7bdde07eade0244be7501));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x1b968263f4ef599fc902b74ffffe57fb83d6a391785fafa2b5482e8af037e3f3), uint256(0x14da6d48084cd31e4186b5ebcf2fb32149e447032734116d59a48a2331e50cee));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x2b9ca68729672c5eea142806f60347b8fed18a8a1a8d06785b77b2add712724f), uint256(0x1cd38dca6db683a44b030698ceee7a49f14218c6d16af4a6443dae630613f880));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x03092b7d327fd6ef5a8a8c5650fc403cce3fecf09f6568fbf5771945469d6652), uint256(0x00f63a95ade3fddbe9c184fbac0bc16d86597df286711b307c6c750a1f0f0bae));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x241c5754dab5851d21b5baa26fbd2144a0b272904ef6e23c90617802ae38ed8c), uint256(0x2758da95f0210ba3b7e48b9520e90a2488ce984b479dca456bab705164aa9a5e));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x0fd29f60d9950bb3ef0f6d068f66ff2694c03e8fc9277471120e81219719b4fc), uint256(0x2ab5108bd21969b18192542ba0951851bd6c34552a5ef76202954d570e3ee635));
        vk.gamma_abc[7] = Pairing.G1Point(uint256(0x13f9ed70514b47428095d6a6e768bbdf4372b71eb27d7b16c6a3d2efd4a6fbb4), uint256(0x2339678210acce4eab1d60a19900a2c98254c766b72dc4b0d4d002fbda62c7b3));
        vk.gamma_abc[8] = Pairing.G1Point(uint256(0x3052754bbf36f6fc35b68615baf645da106218297f52dbd3effd187a884785b7), uint256(0x2628f87a5f2dd3f5999ce1ee242307964ae272ed4eb11e9652cf7c574508ef91));
        vk.gamma_abc[9] = Pairing.G1Point(uint256(0x0d715c073c93103166aadbb58b5d54d43a0406a3a5c1114de657310f47c1d88d), uint256(0x29f89cec79aaad892b0bb2d9af79fd2fc9f790f478347779b4e5527cd17b1db7));
        vk.gamma_abc[10] = Pairing.G1Point(uint256(0x0353c6f2728d45c6c26ad3700a0bc5eab7e6efd5d3180bb6d6cca7a7c7dcae04), uint256(0x2d0b0751d430a517cc7e61cc30bbcc448e39d21e496018a13b17c84e981bb34c));
        vk.gamma_abc[11] = Pairing.G1Point(uint256(0x0d58e1a5175240a086cb15525fac6c27bbc9136ab2dc819a1e8061d84282e63a), uint256(0x2408129fae10d8b02dd7a70be6defc5f1fcdf2e5dffe34b9e4c240ca26af2f4a));
        vk.gamma_abc[12] = Pairing.G1Point(uint256(0x239576f395f9edef4cbfec691bf87c4abdd3aceece7cbe6b342e9536b26b8f62), uint256(0x0cc3fe71a43d2fd0c60d9e9c15e82d5a68ba2c2168b3c0d450706485756c99ef));
        vk.gamma_abc[13] = Pairing.G1Point(uint256(0x14ec6f14d67f528a3ad4e0ff28b516ce715a6730df5345bdc1efd209137621fc), uint256(0x2b0c5969fcb39377c1239cb1090a182d933725f4b846bca6f6decb3e78260d5d));
        vk.gamma_abc[14] = Pairing.G1Point(uint256(0x2f6ed03e8d8674a8dbf117807c3e5f8095366873b3dc9955a41b53e4c9800cc5), uint256(0x15ddb8c97b28c19c18dbed179bb205d5ecfb9f27d5eff8e9a28a6d4ffb866ce0));
        vk.gamma_abc[15] = Pairing.G1Point(uint256(0x26d839fc38285cdb89a9140cd07054f5ea039f327149f76cc4ef0f1fb4d57fcf), uint256(0x2c4dca10086929ecd2b3a7111abb4cb052074cb14868ef4ac8901dfd6ebc6bf9));
        vk.gamma_abc[16] = Pairing.G1Point(uint256(0x1ba112b65f40d9e13609fe98cc120407ed7754cca75fe40ec9bcc47d8fe801f5), uint256(0x1e55c19597e9b2d1143ca3aaabc1db3fcb0343a4a786985c5ebbb20df770897f));
        vk.gamma_abc[17] = Pairing.G1Point(uint256(0x117d3ce8548da63d7bb80fdd3104f1d79b32c1d514f1a4e77fb5924bd170ca28), uint256(0x0c0a45ff5a42b5f6c54a2734d2b5ee6d9cf7404bedd2da1f17663d3404e0b0aa));
        vk.gamma_abc[18] = Pairing.G1Point(uint256(0x0cd8ce0686547f2e2ca437fe0d9fcccac4df163f87edf0735c6775702c8f4b65), uint256(0x0b8904268626df73d97f4aaccbd7b6f07a25cd18f5cb1a979a4c8403ef46b935));
        vk.gamma_abc[19] = Pairing.G1Point(uint256(0x12ad3065609dc1828f733fb63c2cfbc29417666a26b52dfa93c756d9c6526d75), uint256(0x146379345593634d2ac7c84bb87ee5723353caf317a9e6587731d15f773cbb70));
        vk.gamma_abc[20] = Pairing.G1Point(uint256(0x00a7b7578b50500ae99678d291c4669d0ae1a7ac92b121fffa453e3216972e11), uint256(0x0cc7c77c8b341816e5d19f41d038117900c3498ca57647694d783889434d9e1c));
        vk.gamma_abc[21] = Pairing.G1Point(uint256(0x277075e91ebdf5e5cccb3e8494e42fc10cc882dd9eec334771b7b150d4dff336), uint256(0x0eec77819d3ec0c4525d64c67969a6982c627315f28c75c08c5a76cadcabe0f1));
        vk.gamma_abc[22] = Pairing.G1Point(uint256(0x13f6bac3547d3f2bc4b251f0f1e2c78ed613489ba69c7ca9037e28f339be9325), uint256(0x0c937ee2d8cd82c315a6907247794acf62a1cc95e21f0ff15b1484feda33b60f));
        vk.gamma_abc[23] = Pairing.G1Point(uint256(0x1031ae24b3afb0fb2139bde390b98ca987e1c81a8bb7e97d1412e90e08a28d93), uint256(0x0211f814253ac214fe5c6f90ca75a24ccb4d88f7d3d1384aff8a858bf637f08d));
        vk.gamma_abc[24] = Pairing.G1Point(uint256(0x04cd8cec214e8b2b92761b9d010cda7a10ea4550799431a9203fefc1c2eabd7c), uint256(0x103f9094a1143d40621e2b2f192c0532c561a26b2302b20d76c4606662aa830d));
        vk.gamma_abc[25] = Pairing.G1Point(uint256(0x0e2256fe410a0b59cc4a2c1ff918a7bb8f62bc5dfe036c7cbb263cd02b8f82f8), uint256(0x231896ffde903d9ded22bf624bcdb4c4d2f889fd05533769388b663ffe0b41c7));
        vk.gamma_abc[26] = Pairing.G1Point(uint256(0x130f1aa00fa2f6b916e1189428af0e2ea3000141f9504fa7a67272df03d30537), uint256(0x0a6ca57da683198f111f3eaf8548fab425f8dd55068be956d306f10152f3cf9d));
        vk.gamma_abc[27] = Pairing.G1Point(uint256(0x2ece4ddde1ce8ab7b2d8bd450c07b152192ac911c99b8abe6a7363ebaa750fda), uint256(0x1504cc39dbe1bf418bf135de44d9e65f5f6449c0e56d95ff89d418a88e422f04));
        vk.gamma_abc[28] = Pairing.G1Point(uint256(0x24b42a52e045b2a2dbd8f92946d6944b5afbf95c7b3c6d81d483ebe67d3d1238), uint256(0x2df706c8f8cfc56d9dfbc9d4fa4add8c6cd7c1e9dd8e15087ec39255d949fad0));
        vk.gamma_abc[29] = Pairing.G1Point(uint256(0x2cf9de57520d75d621812157cb5e22bbc1e450e9cc4da3f64d128ee43b6d9785), uint256(0x07f9bc52d5e9cf3a3992b96a8b4ef6e3c8815274cb2f87066bf56870640fb56f));
        vk.gamma_abc[30] = Pairing.G1Point(uint256(0x0bf5b25e43b8d6aaedeb14d76dbe3fdc985bf2e28c7298f7cfa19eaefc14100e), uint256(0x20b7c710cf797baf688d9c063cafecf09fc71c7d0d8e1c4bd7c8a6da8254d458));
        vk.gamma_abc[31] = Pairing.G1Point(uint256(0x24e5c918792cc6cdfbcb0a20078a0409d23c6d9ef351f181faeae333068e65e6), uint256(0x17fe578181778395afe8ebd1d035e078ea98e0d38e7fd22f2ee314642e65d1db));
        vk.gamma_abc[32] = Pairing.G1Point(uint256(0x1de1dd077ace054c114dd07e2da8ffbd8a079401aa691a9b745b053f46631e6d), uint256(0x233a18f73ecf8bc8610abdbd6fe7849bd46e51f672b29780f2b45b7cc50ca3e2));
        vk.gamma_abc[33] = Pairing.G1Point(uint256(0x03f2cb3c116f8ae8f245cf2db69d165869534faf1c30c4189f22348a816ce6c1), uint256(0x08dffb335ea740c9925d6711521e8da3b49b73dfc52e8f1ba827b76467888cc1));
        vk.gamma_abc[34] = Pairing.G1Point(uint256(0x301bbb76fa912c543710f549bda50fb12c8adca91f5fe81af20e3ed44cf42e2c), uint256(0x2aa216eb19264284f89f0baa1ec87c51dcc8eeb20a0c2ffae4a3e1bae551419d));
        vk.gamma_abc[35] = Pairing.G1Point(uint256(0x25bf4eff488bfb54a2d28ab3e57e0d526504d350ad75c37d50d867efa222c1ef), uint256(0x0f891d48dae747567e563ab2201fe3a9a545a570b73dc0a77abae2106695312f));
        vk.gamma_abc[36] = Pairing.G1Point(uint256(0x1e2f18b035966afd3f4069118532af59803b0bf04e28e0ec83d58391f4d1b945), uint256(0x22d59a552a5c9674f9799f34ca9841af1c93a442a0a4651f898642ae79018cbd));
        vk.gamma_abc[37] = Pairing.G1Point(uint256(0x181fe7009dd48ab4e1c8e47a6dc0f12356b0c9adc2df240a28f3606f7af69c52), uint256(0x1fcbd45a1f5df96ae1e717e786c55dec9c46545534c5fa3947d0531d1bca606a));
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
            Proof memory proof, uint[37] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](37);
        
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
