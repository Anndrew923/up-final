import { useId, useState, type FC } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { ROUTES } from '../config/routes';
import { useAdminLadderReports } from '../hooks/useAdminLadderReports';
import { useShellScrollLock } from '../hooks/useShellScrollLock';
import type { LadderAdminReportRow, ProcessLadderReportAction } from '../services/ladderAdminService';

type ConfirmState = {
  report: LadderAdminReportRow;
  action: ProcessLadderReportAction;
} | null;

function formatReportTime(iso: string | null, fallback: string): string {
  if (!iso) return fallback;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return fallback;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ms));
  } catch {
    return iso;
  }
}

const ConfirmDialog: FC<{
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  busy: boolean;
  tone: 'approve' | 'reject';
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, body, confirmLabel, cancelLabel, busy, tone, onConfirm, onCancel }) => {
  const titleId = useId();
  useShellScrollLock(open);
  if (!open || typeof document === 'undefined') return null;

  const confirmClass =
    tone === 'approve'
      ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
      : 'border-zinc-500 bg-zinc-800 text-zinc-100';

  return createPortal(
    <div
      className="fixed inset-0 z-[230] flex items-end justify-center pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:items-center sm:px-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label={cancelLabel}
        disabled={busy}
        onClick={onCancel}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-700 bg-bg-card px-4 pb-6 pt-4 shadow-panel sm:rounded-2xl"
      >
        <h2 id={titleId} className="text-base font-semibold text-zinc-50">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="min-h-11 rounded-xl border border-zinc-600 text-sm font-semibold text-zinc-200"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`min-h-11 rounded-xl border text-sm font-semibold disabled:opacity-50 ${confirmClass}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
};

const AdminPanelPage: FC = () => {
  const { t } = useTranslation('common');
  const {
    phase,
    reports,
    nextCursor,
    loadingList,
    processingId,
    banner,
    refresh,
    loadMore,
    processReport,
  } = useAdminLadderReports();
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  if (phase === 'checking') {
    return (
      <main className="ui-shell max-w-3xl text-zinc-100">
        <p className="text-sm text-zinc-400">{t('admin.loading')}</p>
      </main>
    );
  }

  if (phase === 'forbidden' || phase === 'error') {
    return <Navigate to={ROUTES.home} replace />;
  }

  const confirmBusy = Boolean(confirm && processingId === confirm.report.id);

  return (
    <main className="ui-shell relative max-w-3xl space-y-6 text-zinc-100">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="space-y-2 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-info">
            {t('admin.kicker')}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            {t('admin.title')}
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">{t('admin.subtitle')}</p>
        </div>
        <button
          type="button"
          className="ui-btn shrink-0 text-xs"
          disabled={loadingList}
          onClick={() => void refresh()}
        >
          {loadingList ? t('admin.refreshing') : t('admin.refresh')}
        </button>
      </header>

      {banner === 'process-ok' ? (
        <p className="text-sm text-emerald-300" role="status">
          {t('admin.processOk')}
        </p>
      ) : null}
      {banner === 'process-fail' ? (
        <p className="text-sm text-rose-300" role="status">
          {t('admin.processFail')}
        </p>
      ) : null}
      {banner === 'list-fail' ? (
        <p className="text-sm text-rose-300" role="status">
          {t('admin.listFail')}
        </p>
      ) : null}

      {loadingList && reports.length === 0 ? (
        <p className="text-sm text-zinc-400">{t('admin.loadingList')}</p>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-bg-card/95 px-5 py-10 text-center shadow-panel">
          <p className="text-sm text-zinc-300">{t('admin.empty')}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => {
            const targetName =
              report.target?.displayName?.trim() || t('admin.unknownName');
            const reporterName =
              report.reporter?.displayName?.trim() ||
              (report.reporterUid
                ? `${report.reporterUid.slice(0, 8)}…`
                : t('admin.unknownName'));
            const avatarUrl = report.target?.avatarUrl;
            const busy = processingId === report.id;

            return (
              <li
                key={report.id}
                className="rounded-2xl border border-zinc-800 bg-bg-card/95 p-4 shadow-panel backdrop-blur"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-900">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-zinc-400">
                        {targetName.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-semibold text-zinc-50">
                      {t('admin.card.target', { name: targetName })}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {t('admin.card.type', {
                        type: t(`ladder.moderation.reportType.${report.type}`, {
                          defaultValue: t('admin.unknownType'),
                        }),
                      })}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {t('admin.card.time', {
                        time: formatReportTime(report.createdAt, t('admin.unknownTime')),
                      })}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {t('admin.card.reporter', { name: reporterName })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-100 disabled:opacity-50"
                    disabled={Boolean(processingId)}
                    onClick={() => setConfirm({ report, action: 'APPROVE' })}
                  >
                    {busy && confirm?.action === 'APPROVE'
                      ? t('admin.busy')
                      : t('admin.approve')}
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border border-zinc-600 bg-transparent px-3 text-sm font-semibold text-zinc-200 disabled:opacity-50"
                    disabled={Boolean(processingId)}
                    onClick={() => setConfirm({ report, action: 'REJECT' })}
                  >
                    {busy && confirm?.action === 'REJECT'
                      ? t('admin.busy')
                      : t('admin.reject')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {nextCursor ? (
        <button
          type="button"
          className="ui-btn w-full"
          disabled={loadingList}
          onClick={() => void loadMore()}
        >
          {loadingList ? t('admin.loadingMore') : t('admin.loadMore')}
        </button>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.action === 'APPROVE'
            ? t('admin.confirmApproveTitle')
            : t('admin.confirmRejectTitle')
        }
        body={
          confirm?.action === 'APPROVE'
            ? t('admin.confirmApproveBody')
            : t('admin.confirmRejectBody')
        }
        confirmLabel={
          confirm?.action === 'APPROVE' ? t('admin.approve') : t('admin.reject')
        }
        cancelLabel={t('cancel')}
        busy={confirmBusy}
        tone={confirm?.action === 'APPROVE' ? 'approve' : 'reject'}
        onCancel={() => {
          if (!confirmBusy) setConfirm(null);
        }}
        onConfirm={() => {
          if (!confirm) return;
          void processReport(confirm.report.id, confirm.action).then((ok) => {
            if (ok) setConfirm(null);
          });
        }}
      />
    </main>
  );
};

export default AdminPanelPage;
