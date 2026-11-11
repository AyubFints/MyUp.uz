using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class ImageProcessor
{
    public static void MakeTransparent(string inputPath, string outputPath)
    {
        using (Bitmap src = new Bitmap(inputPath))
        {
            int w = src.Width;
            int h = src.Height;
            using (Bitmap dst = new Bitmap(w, h, PixelFormat.Format32bppArgb))
            {
                Rectangle rect = new Rectangle(0, 0, w, h);
                BitmapData srcData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
                BitmapData dstData = dst.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

                int bytes = Math.Abs(srcData.Stride) * h;
                byte[] rgb = new byte[bytes];
                Marshal.Copy(srcData.Scan0, rgb, 0, bytes);
                src.UnlockBits(srcData);

                // Queue for BFS
                bool[] isBg = new bool[w * h];
                Queue<int> q = new Queue<int>();

                // Helper to check white
                // Background is white (R,G,B >= 240)
                Func<int, int, bool> isWhite = (x, y) =>
                {
                    int idx = y * srcData.Stride + x * 4;
                    byte b = rgb[idx];
                    byte g = rgb[idx + 1];
                    byte r = rgb[idx + 2];
                    return (r >= 238 && g >= 238 && b >= 238);
                };

                // Seed border pixels
                for (int x = 0; x < w; x++)
                {
                    if (isWhite(x, 0)) { isBg[0 * w + x] = true; q.Enqueue(0 * w + x); }
                    if (isWhite(x, h - 1)) { isBg[(h - 1) * w + x] = true; q.Enqueue((h - 1) * w + x); }
                }
                for (int y = 0; y < h; y++)
                {
                    if (isWhite(0, y)) { isBg[y * w + 0] = true; q.Enqueue(y * w + 0); }
                    if (isWhite(w - 1, y)) { isBg[y * w + (w - 1)] = true; q.Enqueue(y * w + (w - 1)); }
                }

                int[] dx = { 1, -1, 0, 0 };
                int[] dy = { 0, 0, 1, -1 };

                while (q.Count > 0)
                {
                    int curr = q.Dequeue();
                    int cx = curr % w;
                    int cy = curr / w;

                    for (int i = 0; i < 4; i++)
                    {
                        int nx = cx + dx[i];
                        int ny = cy + dy[i];
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h)
                        {
                            int nidx = ny * w + nx;
                            if (!isBg[nidx] && isWhite(nx, ny))
                            {
                                isBg[nidx] = true;
                                q.Enqueue(nidx);
                            }
                        }
                    }
                }

                // Apply transparency with edge anti-aliasing
                byte[] outRgb = new byte[bytes];
                Array.Copy(rgb, outRgb, bytes);

                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        int pos = y * w + x;
                        int idx = y * srcData.Stride + x * 4;

                        if (isBg[pos])
                        {
                            outRgb[idx + 0] = 0;
                            outRgb[idx + 1] = 0;
                            outRgb[idx + 2] = 0;
                            outRgb[idx + 3] = 0; // Alpha 0
                        }
                        else
                        {
                            // Check if neighbor is background (edge feathering)
                            bool hasBgNeighbor = false;
                            for (int i = 0; i < 4; i++)
                            {
                                int nx = x + dx[i];
                                int ny = y + dy[i];
                                if (nx >= 0 && nx < w && ny >= 0 && ny < h && isBg[ny * w + nx])
                                {
                                    hasBgNeighbor = true;
                                    break;
                                }
                            }

                            if (hasBgNeighbor)
                            {
                                byte b = rgb[idx + 0];
                                byte g = rgb[idx + 1];
                                byte r = rgb[idx + 2];
                                int minC = Math.Min(r, Math.Min(g, b));
                                if (minC >= 210)
                                {
                                    double factor = (255 - minC) / 45.0;
                                    if (factor < 0) factor = 0;
                                    if (factor > 1) factor = 1;
                                    outRgb[idx + 3] = (byte)(factor * 255);
                                }
                                else
                                {
                                    outRgb[idx + 3] = 255;
                                }
                            }
                            else
                            {
                                outRgb[idx + 3] = 255;
                            }
                        }
                    }
                }

                Marshal.Copy(outRgb, 0, dstData.Scan0, bytes);
                dst.UnlockBits(dstData);
                dst.Save(outputPath, ImageFormat.Png);
            }
        }
    }

    public static Rectangle GetContentBounds(string inputPath)
    {
        using (Bitmap src = new Bitmap(inputPath))
        {
            int w = src.Width;
            int h = src.Height;
            Rectangle rect = new Rectangle(0, 0, w, h);
            BitmapData data = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            int bytes = Math.Abs(data.Stride) * h;
            byte[] buffer = new byte[bytes];
            Marshal.Copy(data.Scan0, buffer, 0, bytes);
            src.UnlockBits(data);

            int minX = w, maxX = 0, minY = h, maxY = 0;
            for (int y = 0; y < h; y++)
            {
                int rowOffset = y * data.Stride;
                for (int x = 0; x < w; x++)
                {
                    byte a = buffer[rowOffset + x * 4 + 3];
                    if (a > 15)
                    {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (minX > maxX || minY > maxY)
            {
                return new Rectangle(0, 0, w, h);
            }
            return new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
        }
    }

    public static void CropToContent(string inputPath, string outputPath)
    {
        Rectangle bounds = GetContentBounds(inputPath);
        using (Bitmap src = new Bitmap(inputPath))
        using (Bitmap dst = new Bitmap(bounds.Width, bounds.Height, PixelFormat.Format32bppArgb))
        {
            using (Graphics g = Graphics.FromImage(dst))
            {
                g.Clear(Color.Transparent);
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.SmoothingMode = SmoothingMode.HighQuality;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.CompositingQuality = CompositingQuality.HighQuality;
                g.DrawImage(src, new Rectangle(0, 0, bounds.Width, bounds.Height), bounds, GraphicsUnit.Pixel);
            }
            dst.Save(outputPath, ImageFormat.Png);
        }
    }

    public static void GeneratePaddedIcon(string inputPath, string outputPath, int targetW, int targetH, double contentRatio)
    {
        Rectangle bounds = GetContentBounds(inputPath);
        using (Bitmap src = new Bitmap(inputPath))
        using (Bitmap dst = new Bitmap(targetW, targetH, PixelFormat.Format32bppArgb))
        {
            using (Graphics g = Graphics.FromImage(dst))
            {
                g.Clear(Color.Transparent);
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.SmoothingMode = SmoothingMode.HighQuality;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.CompositingQuality = CompositingQuality.HighQuality;

                double maxContentDim = Math.Min(targetW, targetH) * contentRatio;
                double scale = Math.Min(maxContentDim / bounds.Width, maxContentDim / bounds.Height);

                int drawW = (int)Math.Round(bounds.Width * scale);
                int drawH = (int)Math.Round(bounds.Height * scale);

                int drawX = (targetW - drawW) / 2;
                int drawY = (targetH - drawH) / 2;

                g.DrawImage(src, new Rectangle(drawX, drawY, drawW, drawH), bounds, GraphicsUnit.Pixel);
            }
            dst.Save(outputPath, ImageFormat.Png);
        }
    }

    // Remove blue-gray gradient background (for metallic triangle logo)
    public static void MakeTransparentBlue(string inputPath, string outputPath)
    {
        using (Bitmap src = new Bitmap(inputPath))
        {
            int w = src.Width;
            int h = src.Height;
            using (Bitmap dst = new Bitmap(w, h, PixelFormat.Format32bppArgb))
            {
                Rectangle rect = new Rectangle(0, 0, w, h);
                BitmapData srcData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
                BitmapData dstData = dst.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

                int bytes = Math.Abs(srcData.Stride) * h;
                byte[] rgb = new byte[bytes];
                Marshal.Copy(srcData.Scan0, rgb, 0, bytes);
                src.UnlockBits(srcData);

                bool[] isBg = new bool[w * h];
                Queue<int> q = new Queue<int>();

                // Background is blue-gray: hue ~210-230, saturation low-medium, brightness medium-high
                Func<int, int, bool> isBlueBg = (x, y) =>
                {
                    int idx = y * srcData.Stride + x * 4;
                    int b = rgb[idx];
                    int g = rgb[idx + 1];
                    int r = rgb[idx + 2];

                    // The background is a steel-blue gradient: R~140-190, G~160-200, B~190-220
                    // Also check that blue channel dominates
                    if (b < g - 5 || b < r - 5) return false;
                    int maxC = Math.Max(r, Math.Max(g, b));
                    int minC = Math.Min(r, Math.Min(g, b));
                    int diff = maxC - minC;
                    // Metallic object has high contrast edges; background is smooth gradient
                    // Background: low saturation (diff < 80) and mid-high brightness
                    if (diff > 85) return false;
                    if (maxC < 100) return false;
                    // Blue should be dominant or near-dominant
                    if (b < r - 15) return false;
                    return true;
                };

                // Seed border pixels
                for (int x = 0; x < w; x++)
                {
                    if (isBlueBg(x, 0)) { isBg[0 * w + x] = true; q.Enqueue(0 * w + x); }
                    if (isBlueBg(x, h - 1)) { isBg[(h - 1) * w + x] = true; q.Enqueue((h - 1) * w + x); }
                }
                for (int y = 0; y < h; y++)
                {
                    if (isBlueBg(0, y)) { isBg[y * w + 0] = true; q.Enqueue(y * w + 0); }
                    if (isBlueBg(w - 1, y)) { isBg[y * w + (w - 1)] = true; q.Enqueue(y * w + (w - 1)); }
                }

                int[] ddx = { 1, -1, 0, 0 };
                int[] ddy = { 0, 0, 1, -1 };

                while (q.Count > 0)
                {
                    int curr = q.Dequeue();
                    int cx = curr % w;
                    int cy = curr / w;

                    for (int i = 0; i < 4; i++)
                    {
                        int nx = cx + ddx[i];
                        int ny = cy + ddy[i];
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h)
                        {
                            int nidx = ny * w + nx;
                            if (!isBg[nidx] && isBlueBg(nx, ny))
                            {
                                isBg[nidx] = true;
                                q.Enqueue(nidx);
                            }
                        }
                    }
                }

                byte[] outRgb = new byte[bytes];
                Array.Copy(rgb, outRgb, bytes);

                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        int pos = y * w + x;
                        int idx = y * srcData.Stride + x * 4;

                        if (isBg[pos])
                        {
                            outRgb[idx + 0] = 0;
                            outRgb[idx + 1] = 0;
                            outRgb[idx + 2] = 0;
                            outRgb[idx + 3] = 0;
                        }
                        else
                        {
                            // Edge feathering
                            bool hasBgNeighbor = false;
                            for (int i = 0; i < 4; i++)
                            {
                                int nx = x + ddx[i];
                                int ny = y + ddy[i];
                                if (nx >= 0 && nx < w && ny >= 0 && ny < h && isBg[ny * w + nx])
                                {
                                    hasBgNeighbor = true;
                                    break;
                                }
                            }
                            if (hasBgNeighbor)
                            {
                                outRgb[idx + 3] = 200; // Semi-transparent edge
                            }
                            else
                            {
                                outRgb[idx + 3] = 255;
                            }
                        }
                    }
                }

                Marshal.Copy(outRgb, 0, dstData.Scan0, bytes);
                dst.UnlockBits(dstData);
                dst.Save(outputPath, ImageFormat.Png);
            }
        }
    }

    public static void ResizePng(string inputPath, string outputPath, int targetW, int targetH)
    {
        using (Bitmap src = new Bitmap(inputPath))
        using (Bitmap dst = new Bitmap(targetW, targetH, PixelFormat.Format32bppArgb))
        {
            using (Graphics g = Graphics.FromImage(dst))
            {
                g.Clear(Color.Transparent);
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.SmoothingMode = SmoothingMode.HighQuality;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.CompositingQuality = CompositingQuality.HighQuality;
                g.DrawImage(src, 0, 0, targetW, targetH);
            }
            dst.Save(outputPath, ImageFormat.Png);
        }
    }
}
