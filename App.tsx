import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type RegattaStartTime = {
  id: string;
  label: string;
  hour: number;
  minute: number;
  second: number;
};

const REGATTA_START_TIMES: RegattaStartTime[] = [
  { id: 'start-1', label: '18:44:30', hour: 18, minute: 44, second: 30 },
  { id: 'start-2', label: '18:45:00', hour: 18, minute: 45, second: 0 },
  { id: 'start-3', label: '18:45:40', hour: 18, minute: 45, second: 40 },
  { id: 'start-4', label: '18:46:20', hour: 18, minute: 46, second: 20 },
];

function getTimestampForToday(hour: number, minute: number, second: number): number {
  const d = new Date();
  d.setHours(hour, minute, second, 0);
  return d.getTime();
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(Math.abs(totalSeconds) / 60);
  const seconds = Math.abs(totalSeconds) % 60;
  const sign = totalSeconds < 0 ? '-' : '';
  return `${sign}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatClockTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getAnnouncement(previousSeconds: number, currentSeconds: number): string | null {
  if (currentSeconds === previousSeconds) {
    return null;
  }

  if (currentSeconds <= 0) {
    return 'Start';
  }

  if (currentSeconds <= 60) {
    for (const threshold of [50, 40, 30, 20, 10]) {
      if (previousSeconds > threshold && currentSeconds <= threshold) {
        return `Noch ${threshold} Sekunden`;
      }
    }
    return null;
  }

  const previousMinutes = Math.floor(previousSeconds / 60);
  const currentMinutes = Math.floor(currentSeconds / 60);

  if (previousMinutes > currentMinutes) {
    return currentMinutes === 1 ? 'Noch 1 Minute' : `Noch ${currentMinutes} Minuten`;
  }

  return null;
}

export default function App() {
  const [clockTime, setClockTime] = useState<Date>(new Date());
  const [activeStartId, setActiveStartId] = useState<string | null>(null);
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const activeStart = useMemo(
    () => REGATTA_START_TIMES.find((item) => item.id === activeStartId) ?? null,
    [activeStartId],
  );

  // Live clock — always ticking
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setClockTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Countdown tick
  useEffect(() => {
    if (targetTimestamp === null) {
      return;
    }

    const interval = setInterval(() => {
      const nextSeconds = Math.ceil((targetTimestamp - Date.now()) / 1000);

      if (nextSeconds <= 0) {
        clearInterval(interval);
      }

      setRemainingSeconds((previousSeconds: number) => {
        const announcement = getAnnouncement(previousSeconds, nextSeconds);
        if (announcement) {
          Speech.speak(announcement, { language: 'de-DE' });
        }
        return nextSeconds;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [targetTimestamp]);

  const handleStart = (start: RegattaStartTime) => {
    const target = getTimestampForToday(start.hour, start.minute, start.second);
    const initialSeconds = Math.ceil((target - Date.now()) / 1000);
    setActiveStartId(start.id);
    setRemainingSeconds(initialSeconds);
    setTargetTimestamp(target);
  };

  const handleReset = () => {
    setTargetTimestamp(null);
    setActiveStartId(null);
    setRemainingSeconds(0);
    Speech.stop();
  };

  const isRunning = targetTimestamp !== null && remainingSeconds > 0;
  const isFinished = targetTimestamp !== null && remainingSeconds <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Segeluhr</Text>
        <Text style={styles.clock}>{formatClockTime(clockTime)}</Text>
      </View>
      {!isRunning && !isFinished ? (
        <View style={styles.selectionContainer}>
          <Text style={styles.subtitle}>Regatta-Startzeit wählen</Text>
          {REGATTA_START_TIMES.map((start) => (
            <Pressable key={start.id} style={styles.button} onPress={() => handleStart(start)}>
              <Text style={styles.buttonLabel}>{start.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : isRunning ? (
        <View style={styles.countdownContainer}>
          <Text style={styles.subtitle}>Start um {activeStart?.label ?? ''}</Text>
          <Text style={styles.countdown}>{formatCountdown(remainingSeconds)}</Text>
          <Pressable style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonLabel}>Stoppen</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedText}>Start!</Text>
          <Pressable style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonLabel}>Neu starten</Text>
          </Pressable>
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0d2b45',
  },
  clock: {
    fontSize: 22,
    fontWeight: '500',
    color: '#214d72',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#214d72',
    textAlign: 'center',
  },
  selectionContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdown: {
    fontSize: 72,
    fontWeight: '700',
    color: '#0d2b45',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0d6efd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  finishedContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  finishedText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#198754',
  },
});
