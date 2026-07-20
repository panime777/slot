import { useOutletContext } from 'react-router-dom';
import type { OutletContext } from '../Layout';

export default function PointsPage() {
  const { machine } = useOutletContext<OutletContext>();
  const points = machine.referencePoints ?? [];

  if (points.length === 0) {
    return (
      <section className="points">
        <p className="hint">この機種の設定差ポイントはまだ登録されていません。</p>
      </section>
    );
  }

  return (
    <>
      {points.map((point, i) => (
        <section className="points" key={i}>
          <h2>{point.title}</h2>
          <p className="desc">{point.body}</p>
          {point.table && (
            <div className="points-table-wrap">
              <table className="points-table">
                <thead>
                  <tr>
                    <th />
                    {machine.settings.map((s) => (
                      <th key={s}>設定{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {point.table.rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {machine.settings.map((s) => (
                        <td key={s}>{row.valuesBySetting[s] ?? '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {point.list && (
            <dl className="points-list">
              {point.list.map((item, j) => (
                <div className="points-list-row" key={j}>
                  <dt>{item.term}</dt>
                  <dd>{item.detail}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      ))}
    </>
  );
}
