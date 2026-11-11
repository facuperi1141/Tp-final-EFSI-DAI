import { describeActivity } from '../../utils/activity.js';
import { formatDate } from '../../utils/format.js';

export default function ActivityList({ activities }) {
  if (activities.length === 0) return <p className="muted">Tu actividad va a aparecer acá.</p>;

  return (
    <ul className="activity-list">
      {activities.map((activity) => (
        <li key={activity.id}>
          <i />
          <span>{describeActivity(activity)}</span>
          <small>{formatDate(activity.created_at)}</small>
        </li>
      ))}
    </ul>
  );
}
