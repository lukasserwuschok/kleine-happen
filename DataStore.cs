using System.Text.Json.Nodes;

namespace KleineHappen.Services;

/// <summary>
/// Keeps every document of the app (one per day, food list, plan, ...) in a single JSON file
/// in the app's private storage. Small data, so the whole file is rewritten on every change.
/// Writes go to a temp file first and are then swapped in, so a crash never leaves a half-written file.
/// </summary>
public sealed class DataStore
{
    public static DataStore Instance { get; } = new();

    private readonly object _gate = new();
    private readonly string _file = Path.Combine(FileSystem.AppDataDirectory, "kleine-happen.json");
    private readonly string _backup = Path.Combine(FileSystem.AppDataDirectory, "kleine-happen.previous.json");
    private JsonObject? _docs;

    private JsonObject Docs
    {
        get
        {
            if (_docs is not null) return _docs;
            _docs = TryRead(_file) ?? TryRead(_backup) ?? new JsonObject();
            return _docs;
        }
    }

    public string LoadAll()
    {
        lock (_gate) return Docs.ToJsonString();
    }

    public void Save(string path, string json)
    {
        if (string.IsNullOrWhiteSpace(path)) throw new ArgumentException("path");
        var node = JsonNode.Parse(json) ?? throw new ArgumentException("json");
        lock (_gate)
        {
            Docs[path] = node;
            Persist();
        }
    }

    public void Delete(string path)
    {
        lock (_gate)
        {
            if (Docs.Remove(path)) Persist();
        }
    }

    /// <summary>Removes every saved document, including the safety copy.</summary>
    public void DeleteAll()
    {
        lock (_gate)
        {
            _docs = new JsonObject();
            foreach (var f in new[] { _file, _backup, _file + ".tmp" })
                if (File.Exists(f)) File.Delete(f);
        }
    }

    private void Persist()
    {
        var tmp = _file + ".tmp";
        File.WriteAllText(tmp, Docs.ToJsonString());
        if (File.Exists(_file)) File.Copy(_file, _backup, overwrite: true);
        File.Move(tmp, _file, overwrite: true);
    }

    private static JsonObject? TryRead(string file)
    {
        try
        {
            return File.Exists(file) ? JsonNode.Parse(File.ReadAllText(file)) as JsonObject : null;
        }
        catch
        {
            return null;
        }
    }
}
