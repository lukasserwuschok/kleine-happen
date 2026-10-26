using Android.Content;
using Android.Content.PM;
using Android.Runtime;

namespace KleineHappen;

/// <summary>
/// Long-press the app icon: "Milk +1", "Wet nappy +1", "Dirty nappy +1", "Log a meal".
/// The labels come from the page so they follow the chosen language.
/// </summary>
public static class QuickActions
{
    private static readonly string[] Allowed = { "milk", "wet", "dirty", "meal" };
    private static string _pending = "";

    /// <summary>Raised when a shortcut is used while the app is already open.</summary>
    public static event Action? Arrived;

    public static void Handle(Intent? intent, bool appAlreadyRunning)
    {
        var id = intent?.GetStringExtra("quick");
        if (string.IsNullOrEmpty(id) || !Allowed.Contains(id)) return;
        intent!.RemoveExtra("quick"); // don't repeat it when the activity is recreated
        _pending = id;
        if (appAlreadyRunning) Arrived?.Invoke();
    }

    public static string Take()
    {
        var id = _pending;
        _pending = "";
        return id;
    }

    public static void Publish(Context ctx, IReadOnlyList<(string id, string label)> items)
    {
        if (!OperatingSystem.IsAndroidVersionAtLeast(25)) return;
        var manager = ctx.GetSystemService(Context.ShortcutService)?.JavaCast<ShortcutManager>();
        if (manager is null) return;

        var list = new List<ShortcutInfo>();
        foreach (var (id, label) in items)
        {
            if (!Allowed.Contains(id) || string.IsNullOrWhiteSpace(label)) continue;
            var intent = new Intent(ctx, typeof(MainActivity));
            intent.SetAction(Intent.ActionView);
            intent.PutExtra("quick", id);
            intent.SetFlags(ActivityFlags.ClearTop | ActivityFlags.SingleTop);

            var icon = id switch
            {
                "milk" => Resource.Drawable.ic_sc_milk,
                "meal" => Resource.Drawable.ic_sc_meal,
                _ => Resource.Drawable.ic_sc_diaper
            };
            var shortLabel = label.Length > 25 ? label[..25] : label;
            list.Add(new ShortcutInfo.Builder(ctx, "q_" + id)
                .SetShortLabel(shortLabel)
                .SetLongLabel(label)
                .SetIcon(Android.Graphics.Drawables.Icon.CreateWithResource(ctx, icon))
                .SetIntent(intent)
                .Build());
        }
        manager.SetDynamicShortcuts(list);
    }
}
