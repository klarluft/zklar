import React from "react";
import blockies from "ethereum-blockies";
import styled from "styled-components";

interface Props {
  account: string;
  sizePx: number;
}

const Image = styled.img`
  border-radius: 8px;
`;

export const Avatar: React.VFC<Props> = ({ account, sizePx }) => {
  const dataUrl = React.useMemo(() => {
    const canvasEl = blockies.create({
      seed: account,
      color: "#ba1414",
      bgcolor: "#1ea3c4",
      size: 8,
      scale: sizePx / 8,
      spotcolor: "#26b4d4",
    }) as HTMLCanvasElement;

    return canvasEl.toDataURL();
  }, [account, sizePx]);

  return <Image src={dataUrl} width={sizePx} height={sizePx} />;
};
