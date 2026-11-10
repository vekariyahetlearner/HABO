package com.heatmaps.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** A fixed 2x4 monthly rhythm widget. It retains only completion dates, never notes. */
public class MonthlyHabitWidget extends AppWidgetProvider {
  static final String HABIT_PREFIX = "monthly_habit_";
  private static final int[] DAY_IDS = {
    R.id.month_d1, R.id.month_d2, R.id.month_d3, R.id.month_d4, R.id.month_d5, R.id.month_d6, R.id.month_d7,
    R.id.month_d8, R.id.month_d9, R.id.month_d10, R.id.month_d11, R.id.month_d12, R.id.month_d13, R.id.month_d14,
    R.id.month_d15, R.id.month_d16, R.id.month_d17, R.id.month_d18, R.id.month_d19, R.id.month_d20, R.id.month_d21,
    R.id.month_d22, R.id.month_d23, R.id.month_d24, R.id.month_d25, R.id.month_d26, R.id.month_d27, R.id.month_d28,
    R.id.month_d29, R.id.month_d30, R.id.month_d31
  };

  static void update(Context context, AppWidgetManager manager, int widgetId) {
    android.os.Bundle options = manager.getAppWidgetOptions(widgetId);
    int height = Math.max(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0), options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0));
    int layout = height < 155 ? R.layout.monthly_habit_widget_compact
      : height < 215 ? R.layout.monthly_habit_widget_medium
      : R.layout.monthly_habit_widget;
    RemoteViews views = new RemoteViews(context.getPackageName(), layout);
    String habitId = context.getSharedPreferences(HabitStreakWidget.PREFS, Context.MODE_PRIVATE).getString(HABIT_PREFIX + widgetId, "");
    String title = "Choose a habit";
    HashSet<String> completed = new HashSet<>();
    try {
      JSONArray habits = new JSONArray(context.getSharedPreferences(HabitStreakWidget.PREFS, Context.MODE_PRIVATE).getString(HabitStreakWidget.DATA, "[]"));
      for (int i = 0; i < habits.length(); i++) {
        JSONObject habit = habits.getJSONObject(i);
        if (habitId.equals(habit.optString("id"))) {
          title = habit.optString("title", "Habit");
          JSONArray dates = habit.optJSONArray("completedDates");
          if (dates != null) for (int j = 0; j < dates.length(); j++) completed.add(dates.optString(j));
          break;
        }
      }
    } catch (Exception ignored) { }

    Calendar calendar = Calendar.getInstance();
    String monthKey = new SimpleDateFormat("yyyy-MM", Locale.US).format(calendar.getTime());
    String monthName = new SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(calendar.getTime());
    int days = calendar.getActualMaximum(Calendar.DAY_OF_MONTH);
    int total = 0;
    for (int day = 1; day <= days; day++) {
      String date = String.format(Locale.US, "%s-%02d", monthKey, day);
      if (completed.contains(date)) total++;
    }
    if (layout == R.layout.monthly_habit_widget) for (int day = 1; day <= DAY_IDS.length; day++) {
      int id = DAY_IDS[day - 1];
      if (day > days) { views.setViewVisibility(id, android.view.View.INVISIBLE); continue; }
      String date = String.format(Locale.US, "%s-%02d", monthKey, day);
      boolean done = completed.contains(date);
      views.setTextViewText(id, String.valueOf(day));
      views.setInt(id, "setBackgroundResource", done ? R.drawable.widget_month_done : R.drawable.widget_month_empty);
      views.setTextColor(id, done ? 0xFF062D16 : 0xFFB9BBC4);
    }
    views.setTextViewText(R.id.month_title, title);
    views.setTextViewText(R.id.month_summary, monthName + "  •  " + total + "/" + days + " complete");
    if (layout != R.layout.monthly_habit_widget) {
      views.setTextViewText(R.id.month_stat, total + " of " + days + " days");
      views.setImageViewBitmap(R.id.month_heatmap, drawMonth(calendar, completed, monthKey));
    }
    Intent open = new Intent(context, MainActivity.class);
    PendingIntent pending = PendingIntent.getActivity(context, widgetId, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    views.setOnClickPendingIntent(R.id.month_title, pending);
    manager.updateAppWidget(widgetId, views);
  }

  private static Bitmap drawMonth(Calendar source, HashSet<String> completed, String monthKey) {
    final int cell = 20, gap = 4, pad = 3;
    Bitmap bitmap = Bitmap.createBitmap(7 * (cell + gap) + pad * 2, 6 * (cell + gap) + pad * 2, Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(bitmap); Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    Calendar cursor = (Calendar) source.clone(); cursor.set(Calendar.DAY_OF_MONTH, 1);
    int days = cursor.getActualMaximum(Calendar.DAY_OF_MONTH);
    int start = (cursor.get(Calendar.DAY_OF_WEEK) + 5) % 7;
    for (int day = 1; day <= days; day++) {
      int index = start + day - 1, col = index % 7, row = index / 7;
      float x = pad + col * (cell + gap), y = pad + row * (cell + gap);
      boolean done = completed.contains(String.format(Locale.US, "%s-%02d", monthKey, day));
      paint.setColor(done ? Color.rgb(34, 197, 94) : Color.rgb(41, 43, 51));
      canvas.drawRoundRect(new RectF(x, y, x + cell, y + cell), 5, 5, paint);
    }
    return bitmap;
  }

  static void updateAll(Context context) {
    AppWidgetManager manager = AppWidgetManager.getInstance(context);
    int[] ids = manager.getAppWidgetIds(new ComponentName(context, MonthlyHabitWidget.class));
    for (int id : ids) update(context, manager, id);
  }

  @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
    for (int id : ids) update(context, manager, id);
  }

  @Override public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int widgetId, android.os.Bundle options) {
    update(context, manager, widgetId);
  }
}
