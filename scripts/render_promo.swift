import AppKit
import AVFoundation
import CoreMedia
import CoreVideo
import ImageIO
import UniformTypeIdentifiers
import WebKit

let width = 1280
let height = 800
let fps = 30
let prototypeURL = URL(string: "http://127.0.0.1:5180/mortgage")!
let mapURL = URL(string: "http://127.0.0.1:5180/map")!

guard CommandLine.arguments.count == 3 else {
  fputs("Usage: render_promo.swift <source-slide.png> <output-directory>\n", stderr)
  exit(1)
}

let sourceSlideURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputDirectory = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
let coverURL = outputDirectory.appendingPathComponent("mortgage-promo-cover.png")
let videoURL = outputDirectory.appendingPathComponent("mortgage-promo.mp4")

func makeCanvas(_ paint: (CGContext) -> Void) -> CGImage {
  let context = CGContext(
    data: nil,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  )!
  context.setFillColor(NSColor.white.cgColor)
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))
  paint(context)
  return context.makeImage()!
}

func drawText(
  _ text: String,
  in rect: CGRect,
  fontSize: CGFloat,
  color: NSColor,
  alignment: NSTextAlignment = .left,
  weight: NSFont.Weight = .bold
) {
  let style = NSMutableParagraphStyle()
  style.alignment = alignment
  style.lineBreakMode = .byWordWrapping
  style.lineSpacing = fontSize * 0.06
  let value = NSAttributedString(
    string: text,
    attributes: [
      .font: NSFont.systemFont(ofSize: fontSize, weight: weight),
      .foregroundColor: color,
      .paragraphStyle: style,
    ]
  )
  value.draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading])
}

func makeCover() throws -> CGImage {
  guard let source = NSImage(contentsOf: sourceSlideURL),
        let sourceCG = source.cgImage(forProposedRect: nil, context: nil, hints: nil)
  else { throw NSError(domain: "promo", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot open source slide"]) }
  guard let sourceBlue = sourceCG.cropping(to: CGRect(x: 32, y: 32, width: 1, height: 1)) else {
    throw NSError(domain: "promo", code: 5, userInfo: [NSLocalizedDescriptionKey: "Cannot sample source slide colour"])
  }

  let result = makeCanvas { context in
    context.draw(sourceCG, in: CGRect(x: 0, y: 0, width: width, height: height))
    // The supplied slide has a solid-blue title area. Repaint only that area and preserve its graphics.
    context.interpolationQuality = .none
    context.draw(sourceBlue, in: CGRect(x: 0, y: 150, width: 830, height: 520))
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
    drawText(
      "циан\nпомогает\nс ипотекой",
      in: CGRect(x: 110, y: 245, width: 570, height: 320),
      fontSize: 72,
      color: .white,
      alignment: .center,
      weight: .heavy
    )
    NSGraphicsContext.restoreGraphicsState()
  }

  guard let destination = CGImageDestinationCreateWithURL(coverURL as CFURL, UTType.png.identifier as CFString, 1, nil) else {
    throw NSError(domain: "promo", code: 2, userInfo: [NSLocalizedDescriptionKey: "Cannot create cover destination"])
  }
  CGImageDestinationAddImage(destination, result, nil)
  CGImageDestinationFinalize(destination)
  return result
}

func addCaption(_ image: CGImage, text: String) -> CGImage {
  makeCanvas { context in
    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    context.setFillColor(NSColor.black.withAlphaComponent(0.58).cgColor)
    context.fill(CGRect(x: 0, y: 0, width: width, height: 112))
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
    drawText(text, in: CGRect(x: 52, y: 33, width: 1176, height: 54), fontSize: 31, color: .white, alignment: .center)
    NSGraphicsContext.restoreGraphicsState()
  }
}

func blend(_ left: CGImage, _ right: CGImage, progress: CGFloat) -> CGImage {
  makeCanvas { context in
    context.draw(left, in: CGRect(x: 0, y: 0, width: width, height: height))
    context.setAlpha(progress)
    context.draw(right, in: CGRect(x: 0, y: 0, width: width, height: height))
  }
}

func writeVideo(_ scenes: [(image: CGImage, seconds: Double)]) throws {
  try? FileManager.default.removeItem(at: videoURL)
  let writer = try AVAssetWriter(outputURL: videoURL, fileType: .mp4)
  let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 1_200_000],
  ]
  let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
  input.expectsMediaDataInRealTime = false
  let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input,
    sourcePixelBufferAttributes: [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
      kCVPixelBufferWidthKey as String: width,
      kCVPixelBufferHeightKey as String: height,
      kCVPixelBufferCGImageCompatibilityKey as String: true,
      kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
    ]
  )
  writer.add(input)
  guard writer.startWriting() else { throw writer.error! }
  writer.startSession(atSourceTime: .zero)

  var frame = 0
  for (sceneIndex, scene) in scenes.enumerated() {
    let next = scenes.indices.contains(sceneIndex + 1) ? scenes[sceneIndex + 1].image : nil
    let frames = Int(scene.seconds * Double(fps))
    for offset in 0..<frames {
      while !input.isReadyForMoreMediaData { RunLoop.current.run(until: Date().addingTimeInterval(0.002)) }
      let image: CGImage
      if let next, offset < min(12, frames) {
        image = blend(scene.image, next, progress: CGFloat(offset) / 12)
      } else {
        image = scene.image
      }
      var buffer: CVPixelBuffer?
      CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &buffer)
      guard let buffer else { throw NSError(domain: "promo", code: 3) }
      CVPixelBufferLockBaseAddress(buffer, [])
      let pixelContext = CGContext(
        data: CVPixelBufferGetBaseAddress(buffer),
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
      )!
      pixelContext.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
      CVPixelBufferUnlockBaseAddress(buffer, [])
      let time = CMTime(value: CMTimeValue(frame), timescale: CMTimeScale(fps))
      guard adaptor.append(buffer, withPresentationTime: time) else { throw writer.error! }
      frame += 1
    }
  }
  input.markAsFinished()
  let semaphore = DispatchSemaphore(value: 0)
  writer.finishWriting { semaphore.signal() }
  semaphore.wait()
  guard writer.status == .completed else { throw writer.error ?? NSError(domain: "promo", code: 4) }
}

final class PrototypeCapture: NSObject, WKNavigationDelegate {
  private let window: NSWindow
  private let webView: WKWebView
  private var phase = "mortgage"
  private var frames: [String: CGImage] = [:]
  private let cover: CGImage

  init(cover: CGImage) {
    self.cover = cover
    let configuration = WKWebViewConfiguration()
    configuration.websiteDataStore = .nonPersistent()
    webView = WKWebView(frame: CGRect(x: 0, y: 0, width: width, height: height), configuration: configuration)
    window = NSWindow(contentRect: CGRect(x: 0, y: 0, width: width, height: height), styleMask: [.titled], backing: .buffered, defer: false)
    super.init()
    window.contentView = NSView(frame: CGRect(x: 0, y: 0, width: width, height: height))
    window.contentView?.addSubview(webView)
    window.orderFrontRegardless()
    webView.navigationDelegate = self
  }

  func start() { webView.load(URLRequest(url: prototypeURL)) }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    if phase == "map" {
      snapshot { image in
        self.frames["map"] = image
        self.finish()
      }
      return
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) { self.captureContacts() }
  }

  private func snapshot(_ done: @escaping (CGImage) -> Void) {
    let config = WKSnapshotConfiguration()
    config.rect = CGRect(x: 0, y: 0, width: width, height: height)
    webView.takeSnapshot(with: config) { image, error in
      guard let image, let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        fputs("Screenshot error: \(error?.localizedDescription ?? "unknown")\n", stderr)
        exit(1)
      }
      done(cg)
    }
  }

  private func act(_ javascript: String, then: @escaping () -> Void) {
    webView.evaluateJavaScript(javascript) { _, error in
      if let error {
        fputs("Interaction error: \(error.localizedDescription)\n", stderr)
        exit(1)
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.35, execute: then)
    }
  }

  private func captureContacts() {
    act("[...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Подобрать ипотеку').click()") {
      self.snapshot { image in
        self.frames["contacts"] = image
        self.capturePlans()
      }
    }
  }

  private func capturePlans() {
    act("[...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Продолжить').click()") {
      self.act("document.querySelector('input[value=month]').click(); document.querySelector('input[value=yes]').click(); document.querySelector('input[value=family]').click()") {
        self.act("document.querySelector('input[name=consultant][value=yes]').click()") {
          self.snapshot { image in
            self.frames["plans"] = image
            self.captureDetails()
          }
        }
      }
    }
  }

  private func captureDetails() {
    act("[...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Продолжить').click()") {
      self.act("[...document.querySelectorAll('button')].find(e => e.textContent.trim() === '100–200 000 ₽').click(); document.querySelector('input[name=loans][value=no]').click(); const s = document.querySelectorAll('select'); s[0].value = s[0].options[1].value; s[0].dispatchEvent(new Event('change', {bubbles:true})); s[1].value = '13:00–16:00'; s[1].dispatchEvent(new Event('change', {bubbles:true}))") {
        self.snapshot { image in
          self.frames["details"] = image
          self.captureSuccess()
        }
      }
    }
  }

  private func captureSuccess() {
    act("[...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Отправить заявку').click()") {
      self.snapshot { image in
        self.frames["success"] = image
        self.phase = "map"
        self.webView.load(URLRequest(url: mapURL))
      }
    }
  }

  private func finish() {
    let scenes: [(CGImage, String, Double)] = [
      (cover, "", 2.0),
      (frames["contacts"]!, "Данные из профиля — без справок и паспортных данных", 2.5),
      (frames["plans"]!, "Подбираем ипотеку под ваши планы", 2.5),
      (frames["details"]!, "Назначьте звонок в удобное время", 2.5),
      (frames["success"]!, "Заявка отправлена — эксперт позвонит вам", 2.5),
      (frames["map"]!, "Сценарий и метрики — в одном прототипе", 3.0),
    ]
    do {
      try writeVideo(scenes.map { (image: $0.1.isEmpty ? $0.0 : addCaption($0.0, text: $0.1), seconds: $0.2) })
      let size = (try? FileManager.default.attributesOfItem(atPath: videoURL.path)[.size] as? NSNumber)?.intValue ?? 0
      print("Rendered \(videoURL.path) (\(size) bytes)")
      window.close()
      NSApplication.shared.terminate(nil)
    } catch {
      fputs("Video error: \(error.localizedDescription)\n", stderr)
      exit(1)
    }
  }
}

do {
  try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)
  let cover = try makeCover()
  let app = NSApplication.shared
  app.setActivationPolicy(.accessory)
  let capture = PrototypeCapture(cover: cover)
  capture.start()
  app.run()
} catch {
  fputs("Render error: \(error.localizedDescription)\n", stderr)
  exit(1)
}
