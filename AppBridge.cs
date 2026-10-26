using System.Text.Json;

namespace KleineHappen.Services;

/// <summary>
/// Methods the web interface calls through window.HybridWebView.InvokeDotNet(name, args).
/// Only strings go in and out, so no JSON type metadata is needed.
/// </summary>
public sealed class AppBridge
{
    private readonly DataStore _store = DataStore.Instance;

    public string LoadAll() => _store.LoadAll();

    public string Save(string path, string json)
    {
        _store.Save(path, json);
        return "ok";
    }

    public string Delete(string path)
    {
        _store.Delete(path);
        return "ok";
    }

    public string DeleteAll()
    {
        _store.DeleteAll();
        PhotoStore.DeleteAll();
        Reminders.Cancel(Platform.AppContext);
        foreach (var f in Directory.EnumerateFiles(FileSystem.CacheDirectory))
        {
            try { File.Delete(f); } catch { /* temp share files, best effort */ }
        }
        return "ok";
    }

    /// <summary>Opens a web page (privacy policy) in the phone's browser, never inside the app.</summary>
    public async Task<string> OpenUrl(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
            return "invalid";
        await MainThread.InvokeOnMainThreadAsync(() =>
            Browser.Default.OpenAsync(uri, BrowserLaunchMode.SystemPreferred));
        return "ok";
    }

    /// <summary>Writes text to a temp file and opens the Android share sheet (WhatsApp, Mail, Drive, ...).</summary>
    public async Task<string> ShareText(string fileName, string content, string title)
    {
        var safeName = string.Concat(fileName.Split(Path.GetInvalidFileNameChars()));
        var file = Path.Combine(FileSystem.CacheDirectory, safeName);
        await File.WriteAllTextAsync(file, content);

        await MainThread.InvokeOnMainThreadAsync(() =>
            Share.Default.RequestAsync(new ShareFileRequest
            {
                Title = title,
                File = new ShareFile(file)
            }));
        return "ok";
    }

    /// <summary>Lets the user pick a backup file and returns its text, or "" if cancelled.</summary>
    public async Task<string> PickText()
    {
        var result = await MainThread.InvokeOnMainThreadAsync(() =>
            FilePicker.Default.PickAsync(new PickOptions { PickerTitle = "Sicherung auswählen" }));
        if (result is null) return "";

        await using var stream = await result.OpenReadAsync();
        using var reader = new StreamReader(stream);
        return await reader.ReadToEndAsync();
    }

    // ---------- capabilities ----------

    /// <summary>Tells the page what this platform can do (the iPhone web version answers differently).</summary>
    public string Caps() => "{\"notify\":true,\"camera\":true,\"shortcuts\":true}";

    // ---------- photos ----------

    /// <summary>Lets the user take or choose a photo. Returns the original image as base64, "" if cancelled,
    /// or "denied" without camera permission. The page shrinks it before saving.</summary>
    public async Task<string> PickPhoto(string source)
    {
        return await MainThread.InvokeOnMainThreadAsync(async () =>
        {
            FileResult? file;
            if (source == "camera")
            {
                if (!MediaPicker.Default.IsCaptureSupported) return "denied";
                var status = await Permissions.RequestAsync<Permissions.Camera>();
                if (status != PermissionStatus.Granted) return "denied";
                file = await MediaPicker.Default.CapturePhotoAsync();
            }
            else
            {
                file = await MediaPicker.Default.PickPhotoAsync();
            }
            if (file is null) return "";

            await using var stream = await file.OpenReadAsync();
            using var ms = new MemoryStream();
            await stream.CopyToAsync(ms);
            return Convert.ToBase64String(ms.ToArray());
        });
    }

    public string SavePhoto(string id, string base64)
    {
        PhotoStore.Save(id, base64);
        return "ok";
    }

    public string LoadPhoto(string id) => PhotoStore.Load(id);

    public string DeletePhoto(string id)
    {
        PhotoStore.Delete(id);
        return "ok";
    }

    // ---------- allergen reminders ----------

    /// <summary>Asks for notification permission (Android 13+). Returns "granted" or "denied".</summary>
    public async Task<string> EnableReminders()
    {
        var status = await MainThread.InvokeOnMainThreadAsync(() =>
            Permissions.RequestAsync<Reminders.NotifyPermission>());
        return status == PermissionStatus.Granted ? "granted" : "denied";
    }

    public string SetReminder(string whenMs, string title, string text, string channel)
    {
        if (!long.TryParse(whenMs, out var when) || when <= 0) return "invalid";
        Reminders.Schedule(Platform.AppContext, when, title, text, channel);
        return "ok";
    }

    public string ClearReminder()
    {
        Reminders.Cancel(Platform.AppContext);
        return "ok";
    }

    // ---------- app shortcuts ----------

    /// <summary>Labels for the long-press shortcuts, as JSON: [{"id":"milk","label":"Milch +1"}, ...].</summary>
    public string SetShortcuts(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var items = doc.RootElement.EnumerateArray()
            .Select(e => (e.GetProperty("id").GetString() ?? "", e.GetProperty("label").GetString() ?? ""))
            .ToList();
        QuickActions.Publish(Platform.AppContext, items);
        return "ok";
    }

    /// <summary>Returns the shortcut the app was opened with ("milk", "wet", "dirty", "meal") once, else "".</summary>
    public string TakeQuick() => QuickActions.Take();
}
