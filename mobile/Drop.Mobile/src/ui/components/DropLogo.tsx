import Svg, { Path } from 'react-native-svg';

import { colors } from '../theme';

// Same geometry as the app icon (assets/images/icon.png): a map pin with a bolt cut through it.
const PIN = 'M50 93C43 81 19 66 19 42A31 31 0 0 1 81 42C81 66 57 81 50 93Z';
const BOLT = 'M56 19L36 47L48 47L44 66L65 37L53 37Z';

type Props = {
  size?: number;
  color?: string;
  /** Fills the bolt; when omitted the bolt is a hole that shows what is behind the pin. */
  boltColor?: string;
};

/** The Drop glyph on its own — the pin that marks a deal, struck by the bolt that makes it flash. */
export function DropLogo({ size = 32, color = colors.lime, boltColor }: Props) {
  return (
    <Svg width={size} height={size} viewBox="12 12 76 84">
      {boltColor ? (
        <>
          <Path d={PIN} fill={color} />
          <Path d={BOLT} fill={boltColor} />
        </>
      ) : (
        <Path d={`${PIN}${BOLT}`} fill={color} fillRule="evenodd" />
      )}
    </Svg>
  );
}
