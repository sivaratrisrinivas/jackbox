import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { DemoVideoProps } from "../lib/video/demo-video-props";

const colors = {
  bg: "#0b0b09",
  cream: "#fff7e8",
  muted: "rgba(255,247,232,0.68)",
  ember: "#ff5b2e",
  line: "rgba(255,247,232,0.12)",
};

function clampText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function fade(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
}

function Scene({
  children,
}: {
  children: React.ReactNode;
}) {
  const frame = useCurrentFrame();
  const opacity = fade(frame, 0, 22);
  const translateY = interpolate(frame, [0, 28], [44, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: 88,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function Brand() {
  return (
    <div
      style={{
        position: "absolute",
        top: 54,
        left: 72,
        display: "flex",
        alignItems: "center",
        gap: 16,
        color: colors.cream,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: 3,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 999,
          background: colors.ember,
          boxShadow: "0 0 42px rgba(255,91,46,0.78)",
        }}
      />
      JACKBOX
    </div>
  );
}

function Panel({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        border: `1px solid ${colors.line}`,
        background: "rgba(18,17,15,0.88)",
        borderRadius: 44,
        padding: wide ? 60 : 46,
        boxShadow: "0 36px 120px rgba(0,0,0,0.42)",
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        color: colors.ember,
        fontSize: 28,
        fontWeight: 900,
        letterSpacing: 1,
      }}
    >
      {children}
    </p>
  );
}

function BigTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        margin: "22px 0 0",
        color: colors.cream,
        fontSize: 88,
        lineHeight: 0.98,
        letterSpacing: -3.5,
        maxWidth: 1320,
      }}
    >
      {children}
    </h1>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "28px 0 0",
        color: colors.muted,
        fontSize: 32,
        lineHeight: 1.38,
        maxWidth: 1260,
      }}
    >
      {children}
    </p>
  );
}

function SourceCard({ label, url }: { label: string; url: string }) {
  return (
    <div
      style={{
        border: `1px solid ${colors.line}`,
        borderRadius: 26,
        padding: 24,
        background: "rgba(5,5,5,0.58)",
      }}
    >
      <p style={{ margin: 0, fontSize: 30, fontWeight: 850 }}>{label}</p>
      <p style={{ margin: "10px 0 0", color: colors.muted, fontSize: 22 }}>
        {url}
      </p>
    </div>
  );
}

export function ProspectDemoVideo(props: DemoVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = interpolate(frame, [0, 16 * fps, 32 * fps, 45 * fps], [0.72, 1, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sources = props.sources.length > 0 ? props.sources : [{ label: "Website", url: "" }];

  return (
    <AbsoluteFill
      style={{
        background: colors.bg,
        color: colors.cream,
        fontFamily:
          "Geist, Outfit, Avenir Next, Segoe UI, Helvetica Neue, Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 18% 10%, rgba(255,91,46,${
            0.24 * glow
          }), transparent 30%), radial-gradient(circle at 80% 18%, rgba(255,185,110,0.14), transparent 26%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.075,
          backgroundImage:
            "linear-gradient(rgba(255,247,232,0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(255,247,232,0.32) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <Brand />

      <Sequence from={0} durationInFrames={180}>
        <Scene>
          <Panel wide>
            <Kicker>{props.companyName}</Kicker>
            <BigTitle>The buyer is trying to solve this.</BigTitle>
            <Body>{clampText(props.painPoint, 190)}</Body>
          </Panel>
        </Scene>
      </Sequence>

      <Sequence from={180} durationInFrames={180}>
        <Scene>
          <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1fr", gap: 34 }}>
            <Panel>
              <Kicker>Public proof</Kicker>
              <BigTitle>Start with what they already publish.</BigTitle>
              <Body>{clampText(props.proofPoint, 210)}</Body>
            </Panel>
            <Panel>
              <Kicker>Evidence used</Kicker>
              <div style={{ display: "grid", gap: 18, marginTop: 28 }}>
                {sources.slice(0, 3).map((source) => (
                  <SourceCard key={source.url || source.label} {...source} />
                ))}
              </div>
            </Panel>
          </div>
        </Scene>
      </Sequence>

      <Sequence from={360} durationInFrames={180}>
        <Scene>
          <Panel wide>
            <Kicker>Mini-POC</Kicker>
            <BigTitle>{clampText(props.headline, 95)}</BigTitle>
            <Body>{clampText(props.miniAppConcept, 230)}</Body>
          </Panel>
        </Scene>
      </Sequence>

      <Sequence from={540} durationInFrames={180}>
        <Scene>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 0.72fr", gap: 34 }}>
            <Panel>
              <Kicker>Architecture</Kicker>
              <BigTitle>Show the workflow, then the crawl.</BigTitle>
              <div style={{ display: "grid", gap: 16, marginTop: 26 }}>
                {props.architecture.slice(0, 4).map((step) => (
                  <p
                    key={step}
                    style={{
                      margin: 0,
                      border: `1px solid ${colors.line}`,
                      borderRadius: 22,
                      padding: 18,
                      color: colors.muted,
                      fontSize: 26,
                      lineHeight: 1.28,
                      background: "rgba(5,5,5,0.45)",
                    }}
                  >
                    {step}
                  </p>
                ))}
              </div>
            </Panel>
            <Panel>
              <Kicker>{props.buyerTeam}</Kicker>
              <p style={{ margin: "30px 0 0", fontSize: 116, lineHeight: 1, fontWeight: 900 }}>
                {props.creditCount}
              </p>
              <p style={{ margin: "10px 0 0", color: colors.muted, fontSize: 30 }}>
                estimated credits
              </p>
              <p style={{ margin: "44px 0 0", color: colors.muted, fontSize: 28 }}>
                {props.sourceCount} sources · {props.sourceMode}
              </p>
            </Panel>
          </div>
        </Scene>
      </Sequence>

      <Sequence from={720} durationInFrames={180}>
        <Scene>
          <Panel wide>
            <Kicker>POC next step</Kicker>
            <BigTitle>{clampText(props.pocStep, 105)}</BigTitle>
            <Body>{clampText(props.talkTrack, 230)}</Body>
          </Panel>
        </Scene>
      </Sequence>
    </AbsoluteFill>
  );
}
