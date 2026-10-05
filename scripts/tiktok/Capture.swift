import XCTest
final class Capture: XCTestCase {
 func testControl() throws {
  continueAfterFailure = false
  let app = XCUIApplication(bundleIdentifier: "com.nagaiasuka.game1000")
  app.launch(); _ = app.buttons["ホーム"].waitForExistence(timeout: 20)
  let root = "/tmp/asobit-tiktok-controller/"
  try "ready".write(toFile: root + "ready", atomically: true, encoding: .utf8)
  var last = ""
  for _ in 0..<18000 {
   if let data = try? Data(contentsOf: URL(fileURLWithPath: root + "command.json")),
      let cmd = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let id = cmd["id"] as? String, id != last {
    last = id
    try? FileManager.default.removeItem(atPath: root + "error")
    let op = cmd["op"] as? String ?? ""
    func coord(_ key: String) -> XCUICoordinate {
     let xy = cmd[key] as? [Double] ?? [0.5, 0.5]
     return app.coordinate(withNormalizedOffset: CGVector(dx: xy[0], dy: xy[1]))
    }
    switch op {
    case "home": XCUIDevice.shared.press(.home)
    case "activate": app.activate()
    case "tap": coord("at").tap()
    case "press": coord("at").press(forDuration: cmd["duration"] as? Double ?? 0.5)
    case "drag": coord("from").press(forDuration: cmd["duration"] as? Double ?? 0.1, thenDragTo: coord("to"), withVelocity: XCUIGestureVelocity(rawValue: cmd["velocity"] as? Double ?? 240), thenHoldForDuration: cmd["hold"] as? Double ?? 0.5)
    case "element":
     let key = cmd["key"] as? String ?? ""
     let el = app.descendants(matching: .any).matching(identifier: key).firstMatch
     if el.waitForExistence(timeout: 15) { el.tap() } else {
     try "Element not found: \(key)".write(toFile: root + "error", atomically: true, encoding: .utf8)
    }
    case "tree": try app.debugDescription.write(toFile: root + "tree.txt", atomically: true, encoding: .utf8)
    case "launch": app.terminate(); app.launch(); _ = app.buttons["ホーム"].waitForExistence(timeout: 20)
    case "stop":
     try id.write(toFile: root + "done", atomically: true, encoding: .utf8)
     return
    default: break
    }
    try id.write(toFile: root + "done", atomically: true, encoding: .utf8)
   }
   Thread.sleep(forTimeInterval: 0.1)
  }
 }
}
