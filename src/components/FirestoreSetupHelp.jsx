import { FIRESTORE_MODULES } from '../constants';
import './EditImageModal.css';

const ALL_18_COLLECTIONS = FIRESTORE_MODULES.flatMap((m) => m.collections);

export default function FirestoreSetupHelp({ collections, onClose }) {
  const discovered = new Set(collections || []);
  const discoveredList = ALL_18_COLLECTIONS.filter((c) => discovered.has(c));
  const missingList = ALL_18_COLLECTIONS.filter((c) => !discovered.has(c));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content setup-help-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <h3>24DIGI Firestore setup & how to create</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body setup-help-body">
          <section className="setup-section">
            <h4>Audit — what this CRM handles</h4>
            <ul className="setup-list">
              <li><strong>All 6 modules, 18 collections</strong> from the Firestore Setup Instructions are configured in the app (Challenge, Shop, User & Profile, AI & Meal Plan, Payments, Delivery Partners).</li>
              <li><strong>Discovery:</strong> The app checks which of these collections exist in your Firestore. Only collections that exist (and are readable) appear in the sidebar.</li>
              <li><strong>View:</strong> You can open any collection and see all documents and fields in a table.</li>
              <li><strong>Add document:</strong> Use the &quot;Add document&quot; button on a collection to create a new record. Choose field name, type (string, number, boolean, timestamp), and value. Use &quot;Timestamp (server)&quot; for <code>createdAt</code> / <code>updatedAt</code>.</li>
              <li><strong>Edit image:</strong> On product-like collections you can change the image URL from the table.</li>
            </ul>
          </section>

          <section className="setup-section">
            <h4>What you need to do in Firebase Console</h4>
            <ul className="setup-list">
              <li><strong>Create collections:</strong> In Firestore there is no separate &quot;create collection&quot; step — a collection appears when you add the first document. So either add the first document from this CRM (&quot;Add document&quot;) or from Firebase Console (Data → Start collection → add document with the fields from the setup guide).</li>
              <li><strong>Sample data:</strong> Follow the &quot;24DIGI Firestore Setup Instructions&quot; PDF to add the suggested fields and sample documents (e.g. 3 challenges, 2 shop products, 2 users). You can do that in Firebase Console or, for simple records, from this CRM with &quot;Add document&quot;.</li>
              <li><strong>Nested maps & arrays:</strong> The &quot;Add document&quot; form in the CRM supports flat fields only (string, number, boolean, timestamp). For nested <code>map</code> or <code>array</code> fields (e.g. <code>location</code>, <code>prizes</code>, <code>profile</code>), add or edit those in Firebase Console.</li>
            </ul>
          </section>

          <section className="setup-section">
            <h4>How to create a new collection or document</h4>
            <ol className="setup-list setup-list-ol">
              <li>Open <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">Firebase Console</a> → your project → Firestore Database → Data.</li>
              <li><strong>To create a new collection:</strong> Click &quot;+ Start collection&quot;, enter the Collection ID (e.g. <code>challenges</code>, <code>shop_products</code>). Then add the first document (manually or with &quot;Add document&quot; in this CRM if the collection already exists).</li>
              <li><strong>To add documents from this CRM:</strong> Select the collection in the sidebar, then click &quot;Add document&quot;. Add field name, type, and value. Use type &quot;Timestamp (server)&quot; for <code>createdAt</code> and <code>updatedAt</code>. Click &quot;Add document&quot; to save. The new document will appear after you refresh or after the list auto-updates.</li>
            </ol>
          </section>

          <section className="setup-section">
            <h4>Collection status (discovered in your project)</h4>
            <p className="setup-muted">Collections that exist and are readable appear in the sidebar. Missing ones need to be created in Firebase Console (by adding at least one document).</p>
            <div className="setup-grid">
              <div>
                <strong>Found ({discoveredList.length})</strong>
                <ul className="setup-cols">
                  {discoveredList.map((c) => (
                    <li key={c} className="setup-ok">{c}</li>
                  ))}
                  {discoveredList.length === 0 && <li className="setup-muted">None yet</li>}
                </ul>
              </div>
              <div>
                <strong>Not found ({missingList.length})</strong>
                <ul className="setup-cols">
                  {missingList.map((c) => (
                    <li key={c} className="setup-missing">{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-save" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
