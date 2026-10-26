using Android.App;
using Android.Content;
using Android.Content.PM;
using Android.Content.Res;
using Android.OS;
using AndroidX.Core.View;

namespace KleineHappen;

[Activity(
    Label = "@string/app_name",
    Theme = "@style/Maui.SplashTheme",
    MainLauncher = true,
    LaunchMode = LaunchMode.SingleTop,
    ScreenOrientation = ScreenOrientation.Portrait,
    ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation | ConfigChanges.UiMode |
                           ConfigChanges.ScreenLayout | ConfigChanges.SmallestScreenSize | ConfigChanges.Density)]
public class MainActivity : MauiAppCompatActivity
{
    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);
        ApplySystemBars();
        QuickActions.Handle(Intent, appAlreadyRunning: false);
        Reminders.Restore(this);
    }

    // A shortcut was used while the app was already open.
    protected override void OnNewIntent(Intent? intent)
    {
        base.OnNewIntent(intent);
        QuickActions.Handle(intent, appAlreadyRunning: true);
    }

    public override void OnConfigurationChanged(Configuration newConfig)
    {
        base.OnConfigurationChanged(newConfig);
        ApplySystemBars();
    }

    // Dark icons on the light design, light icons in dark mode.
    // From Android 15 the bars are transparent (edge to edge) and show the page background;
    // on older versions we colour them ourselves.
    private void ApplySystemBars()
    {
        if (Window is null) return;
        var dark = (Resources?.Configuration?.UiMode & UiMode.NightMask) == UiMode.NightYes;

        if (!OperatingSystem.IsAndroidVersionAtLeast(35))
        {
#pragma warning disable CA1422 // only called below API 35
            Window.SetStatusBarColor(Android.Graphics.Color.ParseColor(dark ? "#161731" : "#F4F8FF"));
            Window.SetNavigationBarColor(Android.Graphics.Color.ParseColor(dark ? "#22244A" : "#FFFFFF"));
#pragma warning restore CA1422
        }

        var controller = WindowCompat.GetInsetsController(Window, Window.DecorView!);
        controller.AppearanceLightStatusBars = !dark;
        controller.AppearanceLightNavigationBars = !dark;
    }
}
