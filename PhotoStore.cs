using System.Text.RegularExpressions;

namespace KleineHappen.Services;

/// <summary>
/// Photos for meals and milestones. Each photo is a small JPEG (already shrunk by the page)
/// in the app's private storage. Photos are never uploaded and are not part of the backup file.
/// </summary>
public static partial class PhotoStore
{
    private static readonly string Dir = Path.Combine(FileSystem.AppDataDirectory, "photos");

    [GeneratedRegex("^[a-z0-9_-]{1,40}$")]
    private static partial Regex IdPattern();

    private static string FileFor(string id)
    {
        if (!IdPattern().IsMatch(id)) throw new ArgumentException("invalid photo id");
        return Path.Combine(Dir, id + ".jpg");
    }

    public static void Save(string id, string base64)
    {
        var bytes = Convert.FromBase64String(base64);
        if (bytes.Length > 4_000_000) throw new ArgumentException("photo too large");
        Directory.CreateDirectory(Dir);
        var file = FileFor(id);
        File.WriteAllBytes(file + ".tmp", bytes);
        File.Move(file + ".tmp", file, overwrite: true);
    }

    public static string Load(string id)
    {
        var file = FileFor(id);
        return File.Exists(file) ? Convert.ToBase64String(File.ReadAllBytes(file)) : "";
    }

    public static void Delete(string id)
    {
        var file = FileFor(id);
        if (File.Exists(file)) File.Delete(file);
    }

    public static void DeleteAll()
    {
        if (Directory.Exists(Dir)) Directory.Delete(Dir, recursive: true);
    }
}
