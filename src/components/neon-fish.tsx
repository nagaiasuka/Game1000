import { View } from "react-native";

const INK = "#082238";

function Eye({ surprised = false }: { surprised?: boolean }) {
  return (
    <View
      style={{
        width: 13,
        height: surprised ? 16 : 14,
        borderRadius: 8,
        backgroundColor: "#F5FFFF",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 7,
          height: surprised ? 9 : 7,
          borderRadius: 5,
          backgroundColor: INK,
          marginLeft: 2,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 1,
            right: 1,
            width: 2,
            height: 2,
            borderRadius: 2,
            backgroundColor: "#FFFFFF",
          }}
        />
      </View>
    </View>
  );
}

/** Rounded original fish. Head and fan tail keep a fixed size at every score. */
export function FishHead({
  color,
  surprised = false,
  profile = false,
}: {
  color: string;
  surprised?: boolean;
  profile?: boolean;
}) {
  return (
    <View style={{ width: 52, height: 40 }}>
      {!profile &&
        [-1, 1].map((side) => (
          <View
            key={side}
            style={{
              position: "absolute",
              left: side < 0 ? -9 : 46,
              top: 21,
              width: 15,
              height: 18,
              borderRadius: 10,
              borderTopLeftRadius: side < 0 ? 2 : 10,
              borderTopRightRadius: side > 0 ? 2 : 10,
              backgroundColor: color,
              borderWidth: 1,
              borderColor: "#FFFFFF77",
              transform: [{ rotate: `${side * -28}deg` }],
            }}
          />
        ))}
      <View
        style={{
          width: 52,
          height: 40,
          borderRadius: 25,
          borderWidth: 1.5,
          borderColor: "#FFFFFFBB",
          backgroundColor: color,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: 5,
            top: 3,
            width: 25,
            height: 10,
            borderRadius: 10,
            backgroundColor: "#FFFFFF55",
            transform: [{ rotate: "-18deg" }],
          }}
        />
        <View
          style={{
            position: "absolute",
            left: 5,
            right: 5,
            bottom: -9,
            height: 22,
            borderRadius: 22,
            backgroundColor: "#FFFFFF33",
          }}
        />
        {profile ? (
          <>
            <View style={{ position: "absolute", right: 9, top: 7 }}>
              <Eye surprised={surprised} />
            </View>
            <View
              style={{
                position: "absolute",
                right: 5,
                bottom: 8,
                width: 8,
                height: 5,
                borderBottomWidth: 1.5,
                borderColor: INK,
                borderRadius: 5,
              }}
            />
            <View
              style={{
                position: "absolute",
                right: 23,
                bottom: 9,
                width: 8,
                height: 5,
                borderRadius: 5,
                backgroundColor: "#FF80B77A",
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 10,
                top: 18,
                width: 8,
                height: 14,
                borderLeftWidth: 1,
                borderColor: INK + "44",
                borderRadius: 8,
              }}
            />
          </>
        ) : (
          <>
            <View
              style={{
                position: "absolute",
                top: 7,
                left: 8,
                flexDirection: "row",
                gap: 7,
              }}
            >
              <Eye surprised={surprised} />
              <Eye surprised={surprised} />
            </View>
            {[-1, 1].map((side) => (
              <View
                key={side}
                style={{
                  position: "absolute",
                  left: side < 0 ? 5 : 37,
                  top: 24,
                  width: 8,
                  height: 5,
                  borderRadius: 5,
                  backgroundColor: "#FF80B77A",
                }}
              />
            ))}
            <View
              style={{
                position: "absolute",
                left: 21,
                top: surprised ? 26 : 25,
                width: surprised ? 8 : 9,
                height: surprised ? 8 : 6,
                borderRadius: 6,
                borderWidth: surprised ? 1.5 : 0,
                borderBottomWidth: 1.5,
                borderColor: INK,
                backgroundColor: surprised ? INK + "22" : "transparent",
              }}
            />
          </>
        )}
      </View>
    </View>
  );
}

export function FishTail({ color }: { color: string }) {
  return (
    <View style={{ width: 42, height: 18 }}>
      <View
        style={{
          position: "absolute",
          top: -2,
          left: 15,
          width: 12,
          height: 9,
          borderRadius: 5,
          backgroundColor: color,
        }}
      />
      {[-1, 1].map((side) => (
        <View
          key={side}
          style={{
            position: "absolute",
            left: side < 0 ? 3 : 20,
            top: 4,
            width: 19,
            height: 13,
            borderRadius: 10,
            borderTopLeftRadius: side < 0 ? 3 : 10,
            borderTopRightRadius: side > 0 ? 3 : 10,
            backgroundColor: color,
            borderWidth: 1,
            borderColor: "#FFFFFFAA",
            transform: [{ rotate: `${side * 24}deg` }],
          }}
        />
      ))}
      {[-1, 0, 1].map((ray) => (
        <View
          key={ray}
          style={{
            position: "absolute",
            left: 20 + ray * 5,
            top: 4,
            width: 1,
            height: 11,
            backgroundColor: "#FFFFFF66",
            transform: [{ rotate: `${-ray * 32}deg` }],
          }}
        />
      ))}
    </View>
  );
}

/** Every unhooked fish has this same compact silhouette, independent of its length. */
export function SmallFish({ color }: { color: string }) {
  return (
    <View style={{ width: 70, height: 64 }}>
      <View
        style={{
          position: "absolute",
          left: -9,
          top: 23,
          transform: [{ rotate: "90deg" }, { scale: 0.9 }],
        }}
      >
        <FishTail color={color} />
      </View>
      <View
        style={{
          position: "absolute",
          top: 9,
          left: 29,
          width: 18,
          height: 15,
          borderRadius: 10,
          borderTopRightRadius: 2,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: "#FFFFFF99",
          transform: [{ rotate: "-20deg" }],
        }}
      />
      <View style={{ position: "absolute", left: 14, top: 14 }}>
        <FishHead color={color} profile />
      </View>
      <View
        style={{
          position: "absolute",
          left: 29,
          top: 40,
          width: 15,
          height: 12,
          borderRadius: 9,
          borderTopLeftRadius: 2,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: "#FFFFFF99",
          transform: [{ rotate: "30deg" }],
        }}
      />
    </View>
  );
}

export function FishingHook() {
  return (
    <View style={{ width: 20, height: 24, alignItems: "center" }}>
      <View
        style={{
          position: "absolute",
          right: 4,
          top: 0,
          width: 2,
          height: 17,
          backgroundColor: "#E9FFFF",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 1,
          width: 15,
          height: 13,
          borderWidth: 2,
          borderTopWidth: 0,
          borderColor: "#E9FFFF",
          borderBottomLeftRadius: 9,
          borderBottomRightRadius: 9,
        }}
      />
    </View>
  );
}
