using Android.App;
using Android.Content;
using Android.Runtime;
using AndroidX.Core.App;

namespace KleineHappen;

/// <summary>
/// Allergen reminders. The page works out when the next allergen is due and asks for one
/// notification at that time. Everything runs on the phone (AlarmManager), no server is involved.
/// If the reminder is ignored, it repeats once a day until the app plans a new one.
/// </summary>
public static class Reminders
{
    private const string Prefs = "kh_reminder";
    private const int NotificationId = 4711;
    private const int AlarmRequest = 1;

    /// <summary>Android 13+ asks the user before an app may show notifications.</summary>
    public sealed class NotifyPermission : Permissions.BasePlatformPermission
    {
        public override (string androidPermission, bool isRuntime)[] RequiredPermissions =>
            OperatingSystem.IsAndroidVersionAtLeast(33)
                ? new[] { ("android.permission.POST_NOTIFICATIONS", true) }
                : Array.Empty<(string, bool)>();
    }

    public static void Schedule(Context ctx, long whenMs, string title, string text, string channelName)
    {
        var edit = ctx.GetSharedPreferences(Prefs, FileCreationMode.Private)!.Edit()!;
        edit.PutLong("when", whenMs);
        edit.PutString("title", title);
        edit.PutString("text", text);
        edit.PutString("channel", channelName);
        edit.Apply();
        SetAlarm(ctx, whenMs, title, text, channelName);
    }

    public static void Cancel(Context ctx)
    {
        var edit = ctx.GetSharedPreferences(Prefs, FileCreationMode.Private)!.Edit()!;
        edit.Clear();
        edit.Apply();
        Alarms(ctx)?.Cancel(AlarmIntent(ctx, "", "", ""));
    }

    /// <summary>After a reboot Android forgets alarms; plan the stored one again.</summary>
    public static void Restore(Context ctx)
    {
        var p = ctx.GetSharedPreferences(Prefs, FileCreationMode.Private)!;
        var when = p.GetLong("when", 0);
        if (when <= 0) return;
        var now = Java.Lang.JavaSystem.CurrentTimeMillis();
        while (when < now) when += 24L * 60 * 60 * 1000;
        SetAlarm(ctx, when, p.GetString("title", "") ?? "", p.GetString("text", "") ?? "", p.GetString("channel", "") ?? "");
    }

    internal static void Fire(Context ctx, Intent? intent)
    {
        var title = intent?.GetStringExtra("title") ?? "";
        var text = intent?.GetStringExtra("text") ?? "";
        var channel = intent?.GetStringExtra("channel") ?? "";
        if (title.Length == 0) return;

        Show(ctx, title, text, channel);

        // Repeat tomorrow at the same time until the app plans something new.
        var next = Java.Lang.JavaSystem.CurrentTimeMillis() + 24L * 60 * 60 * 1000;
        var edit = ctx.GetSharedPreferences(Prefs, FileCreationMode.Private)!.Edit()!;
        edit.PutLong("when", next);
        edit.Apply();
        SetAlarm(ctx, next, title, text, channel);
    }

    private static void Show(Context ctx, string title, string text, string channelName)
    {
        const string channelId = "allergens";
        if (OperatingSystem.IsAndroidVersionAtLeast(26))
        {
            var nm = ctx.GetSystemService(Context.NotificationService)?.JavaCast<NotificationManager>();
            nm?.CreateNotificationChannel(new NotificationChannel(channelId,
                channelName.Length > 0 ? channelName : "Reminders", NotificationImportance.Default));
        }

        var open = ctx.PackageManager?.GetLaunchIntentForPackage(ctx.PackageName!) ?? new Intent(ctx, typeof(MainActivity));
        var tap = PendingIntent.GetActivity(ctx, 2, open, PendingIntentFlags.UpdateCurrent | PendingIntentFlags.Immutable);

        var notification = new NotificationCompat.Builder(ctx, channelId)
            .SetSmallIcon(Resource.Drawable.ic_stat_kh)
            .SetContentTitle(title)
            .SetContentText(text)
            .SetStyle(new NotificationCompat.BigTextStyle().BigText(text))
            .SetAutoCancel(true)
            .SetContentIntent(tap)
            .SetPriority(NotificationCompat.PriorityDefault)
            .Build();

        try
        {
            NotificationManagerCompat.From(ctx).Notify(NotificationId, notification);
        }
        catch (Java.Lang.SecurityException)
        {
            // Notifications were switched off for the app; nothing to do.
        }
    }

    private static void SetAlarm(Context ctx, long whenMs, string title, string text, string channel)
    {
        // Inexact alarm: no special permission needed, a few minutes late is fine for a reminder.
        Alarms(ctx)?.SetAndAllowWhileIdle(AlarmType.RtcWakeup, whenMs, AlarmIntent(ctx, title, text, channel));
    }

    private static AlarmManager? Alarms(Context ctx) =>
        ctx.GetSystemService(Context.AlarmService)?.JavaCast<AlarmManager>();

    private static PendingIntent AlarmIntent(Context ctx, string title, string text, string channel)
    {
        var intent = new Intent(ctx, typeof(ReminderReceiver));
        intent.PutExtra("title", title);
        intent.PutExtra("text", text);
        intent.PutExtra("channel", channel);
        return PendingIntent.GetBroadcast(ctx, AlarmRequest, intent, PendingIntentFlags.UpdateCurrent | PendingIntentFlags.Immutable)!;
    }
}

[BroadcastReceiver(Enabled = true, Exported = false)]
public class ReminderReceiver : BroadcastReceiver
{
    public override void OnReceive(Context? context, Intent? intent)
    {
        if (context is not null) Reminders.Fire(context, intent);
    }
}

[BroadcastReceiver(Enabled = true, Exported = true)]
[IntentFilter(new[] { Intent.ActionBootCompleted })]
public class BootReceiver : BroadcastReceiver
{
    public override void OnReceive(Context? context, Intent? intent)
    {
        if (context is not null && intent?.Action == Intent.ActionBootCompleted) Reminders.Restore(context);
    }
}
