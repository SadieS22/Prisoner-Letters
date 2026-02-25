document.addEventListener("DOMContentLoaded", () => {

    const SUPABASE_URL = "https://ugyptaggfyjrpigervif.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVneXB0YWdnZnlqcnBpZ2VydmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzI1MjcsImV4cCI6MjA4NjIwODUyN30.kKFoWl1mxa983zF9eIoGSHf1JtZNF_dq4T6uE2vwT4I";
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let catalogData = [];
    let renderedData = [];
    let selectedRecord = null;
    let sortState = { column: null, ascending: true };

    function openDetailsModal(record) {
        Object.keys(record).forEach(key => {

            const el = document.getElementById("detail-" + key);

            if (el) {
                el.textContent = record[key] ?? "";
            }

        });

        new bootstrap.Modal(
            document.getElementById("detailsModal")
        ).show();
    }

    // ===== STILL INCARCERATED CHANGE HANDLER =====
    const stillSelect = document.getElementById("stillIncarcerated");
    const incarcerationWrapper = document.getElementById("incarcerationDateWrapper");
    const dateInput = document.getElementById("dateLastChecked");

    // Show/hide date box under the select
    stillSelect.addEventListener("change", () => {
    if (stillSelect.value === "yes") {
        incarcerationWrapper.style.display = "block";
        dateInput.required = true;
    } else {
        incarcerationWrapper.style.display = "none";
        dateInput.value = "";
        dateInput.required = false;
    }
    });

    // When loading a record into the form
    function loadRecord(record) {
        if (record.stillIncarcerated) {
            stillSelect.value = "yes";
            incarcerationWrapper.style.display = "block";
            dateInput.value = record.stillIncarcerated; // populate the date
            dateInput.required = true;
        } else {
            stillSelect.value = "no";
            incarcerationWrapper.style.display = "none";
            dateInput.value = "";
            dateInput.required = false;
        }

        // Populate other fields
        document.getElementById("letterDate").value = record.letterDate ?? "";
        document.getElementById("name").value = record.name ?? "";
        document.getElementById("institution").value = record.institution ?? "";
        document.getElementById("identificationNo").value = record.identificationNo ?? "";
        document.getElementById("summaryAsk").value = record.summaryAsk ?? "";
        document.getElementById("responseSent").value = record.responseSent ?? "";
        document.getElementById("responderNameDate").value = record.responderNameDate ?? "";
        document.getElementById("inputterNameDate").value = record.inputterNameDate ?? "";
        document.getElementById("scannedSentNicole").value = record.scannedSentNicole ?? "";
        document.getElementById("address").value = record.address ?? "";
    }

    // ===== SEARCH STILL INCARCERATED =====
    const searchStillSelect = document.getElementById("searchIncarcerated");
    const searchDateWrapper = document.getElementById("searchIncarceratedDateWrapper");
    const searchDateInput = document.getElementById("searchIncarceratedDate");

    // Show/hide date input when select changes
    searchStillSelect.addEventListener("change", () => {
    if (searchStillSelect.value === "searchbydate") {
        searchDateWrapper.style.display = "block";
        searchDateInput.required = true;
    } else {
        searchDateWrapper.style.display = "none";
        searchDateInput.value = "";
        searchDateInput.required = false;
    }
    });

    // Optional: Populate search form if you load a record into it
    function loadSearchRecord(record) {
    if (record.stillIncarcerated) {
        searchStillSelect.value = "searchbydate";
        searchDateWrapper.style.display = "block";
        searchDateInput.value = record.stillIncarcerated;
        searchDateInput.required = true;
    } else {
        searchStillSelect.value = "no";
        searchDateWrapper.style.display = "none";
        searchDateInput.value = "";
        searchDateInput.required = false;
    }

    // Populate other search fields if needed
    document.getElementById("searchName").value = record.name ?? "";
    document.getElementById("searchInstitution").value = record.institution ?? "";
    document.getElementById("searchDate").value = record.letterDate ?? "";
    document.getElementById("searchResponseSent").value = record.responseSent ?? "";
    }

    // ===== LOAD CATALOG =====
    async function loadCatalog(filters = {}) {
    let query = client.from("requests").select("*");

    if (filters.name) query = query.ilike("name", `%${filters.name}%`);
    if (filters.institution) query = query.ilike("institution", `%${filters.institution}%`);
    if (filters.date) query = query.ilike("letterDate", `${filters.date}%`);
    if (filters.idNumber) query = query.ilike("identificationNo", `%${filters.idNumber}%`);
    if (filters.stillIncarcerated === "yes") query = query.not("stillIncarcerated", "is", null);
    if (filters.stillIncarcerated === "no") query = query.is("stillIncarcerated", null);
    if (filters.stillIncarcerated === "searchbydate" && filters.incarceratedDate)
        query = query.eq("stillIncarcerated", filters.incarceratedDate);
    if (filters.responseSent) query = query.eq("responseSent", filters.responseSent);

    const { data, error } = await query.order("letterDate", { ascending: false });
    if (error) return alert(error.message);

    catalogData = data;
    renderedData = [...data];
    renderTable();
    renderModifyTable(); // <-- render on modify tab too
    }

    // ===== RENDER TABLE =====
    function renderTable() {
    const tbody = document.querySelector("#catalogTable tbody");
    tbody.innerHTML = renderedData.map(row => `
        <tr data-id="${row.id}">
        <td>${row.letterDate ?? ""}</td>
        <td>${row.name ?? ""}</td>
        <td>${row.institution ?? ""}</td>
        <td>${row.identificationNo ?? ""}</td>
        <td>${row.stillIncarcerated ?? ""}</td>
        <td>${row.responseSent ?? ""}</td>
        </tr>
    `).join("");

    // Add row click for search tab to select record (optional)
    tbody.querySelectorAll("tr").forEach(tr => {
        tr.addEventListener("click", () => {
        const id = tr.dataset.id;
        const record = catalogData.find(r => r.id == id);
        if (!record) return;
        // Fill search form if needed
        document.getElementById("searchName").value = record.name ?? "";
        document.getElementById("searchInstitution").value = record.institution ?? "";
        document.getElementById("searchDate").value = record.letterDate ?? "";
        });

        tr.addEventListener("dblclick", () => {
            const id = tr.dataset.id;

            const record = catalogData.find(r => r.id == id);

            if (!record) return;

            openDetailsModal(record);
        });
    });
    }

    // ===== MODIFY TABLE =====
    function renderModifyTable() {
    // Create or find modify table
    let modifyTable = document.getElementById("modifyTable");
    if (!modifyTable) {
        modifyTable = document.createElement("table");
        modifyTable.className = "table table-striped mt-3";
        modifyTable.id = "modifyTable";
        const modifyTab = document.querySelector("#modify");
        modifyTab.appendChild(modifyTable);
    }

    modifyTable.innerHTML = `
        <thead>
        <tr>
            <th>Letter Date</th>
            <th>Name</th>
            <th>Institution</th>
            <th>ID No.</th>
            <th>Still Incarcerated</th>
            <th>Response Sent</th>
        </tr>
        </thead>
        <tbody>
        ${renderedData.map(row => `
            <tr data-id="${row.id}">
            <td>${row.letterDate ?? ""}</td>
            <td>${row.name ?? ""}</td>
            <td>${row.institution ?? ""}</td>
            <td>${row.identificationNo ?? ""}</td>
            <td>${row.stillIncarcerated ?? ""}</td>
            <td>${row.responseSent ?? ""}</td>
            </tr>
        `).join("")}
        </tbody>
    `;

    // Make rows selectable to fill modify form
    modifyTable.querySelectorAll("tbody tr").forEach(tr => {
    tr.addEventListener("click", () => {
        const id = tr.dataset.id;
        selectedRecord = catalogData.find(r => r.id == id);
        if (!selectedRecord) return;

        document.getElementById("letterDate").value = selectedRecord.letterDate ?? "";
        document.getElementById("name").value = selectedRecord.name ?? "";
        document.getElementById("institution").value = selectedRecord.institution ?? "";
        document.getElementById("identificationNo").value = selectedRecord.identificationNo ?? "";

        if (selectedRecord.stillIncarcerated) {
        stillSelect.value = "yes";
        incarcerationWrapper.style.display = "block";
        document.getElementById("dateLastChecked").value = selectedRecord.stillIncarcerated;
        } else {
        stillSelect.value = "no";
        incarcerationWrapper.style.display = "none";
        document.getElementById("dateLastChecked").value = "";
        }

        document.getElementById("summaryAsk").value = selectedRecord.summaryAsk ?? "";
        document.getElementById("responseSent").value = selectedRecord.responseSent ?? "";
        document.getElementById("inputterNameDate").value = selectedRecord.inputterNameDate ?? "";
        document.getElementById("responderNameDate").value = selectedRecord.responderNameDate ?? "";
        document.getElementById("scannedSentNicole").value = selectedRecord.scannedSentNicole ?? "";
        document.getElementById("address").value = selectedRecord.address ?? "";
    });
    });
    }

    // ===== SEARCH FORM =====
    document.getElementById("searchForm").addEventListener("submit", e => {
    e.preventDefault();
    loadCatalog({
        name: document.getElementById("searchName").value,
        institution: document.getElementById("searchInstitution").value,
        date: document.getElementById("searchDate").value,
        stillIncarcerated: document.getElementById("searchIncarcerated").value,
        incarceratedDate: document.getElementById("searchIncarceratedDate").value,
        responseSent: document.getElementById("searchResponseSent").value,
        idNumber: document.getElementById("searchID").value
    });
    });
    document.getElementById("resetSearchForm").addEventListener("click", () => {
    document.getElementById("searchForm").reset();
    loadCatalog();
    });

    // ===== MODIFY FORM GET DATA =====
    function getFormData() {
        let incarceratedValue = null;
        if (stillSelect.value === "yes") {
            incarceratedValue = document.getElementById("dateLastChecked").value || null;
        }

        return {
            letterDate: document.getElementById("letterDate").value,
            name: document.getElementById("name").value,
            institution: document.getElementById("institution").value,
            identificationNo: document.getElementById("identificationNo").value,
            stillIncarcerated: incarceratedValue,
            summaryAsk: document.getElementById("summaryAsk").value,
            responseSent: document.getElementById("responseSent").value,
            inputterNameDate: document.getElementById("inputterNameDate").value,
            responderNameDate: document.getElementById("responderNameDate").value,
            scannedSentNicole: document.getElementById("scannedSentNicole").value,
            address: document.getElementById("address").value            
        };
    }

    // ===== MODIFY ACTION BUTTONS =====
    document.getElementById("actionAdd").addEventListener("click", async () => {
    const { error } = await client.from("requests").insert(getFormData());
    if (error) return alert(error.message);
    loadCatalog();
    selectedRecord = null;
    });

    document.getElementById("actionUpdate").addEventListener("click", async () => {
    if (!selectedRecord) return alert("Select a record from the table first!");
    const { error } = await client.from("requests").update(getFormData()).eq("id", selectedRecord.id);
    if (error) return alert(error.message);
    loadCatalog();
    selectedRecord = null;
    });

    document.getElementById("actionDelete").addEventListener("click", async () => {
    if (!selectedRecord) return alert("Select a record from the table first!");
    if (!confirm("Delete this record?")) return;
    const { error } = await client.from("requests").delete().eq("id", selectedRecord.id);
    if (error) return alert(error.message);
    loadCatalog();
    selectedRecord = null;
    });

    document.getElementById("resetAddForm").addEventListener("click", () => {
    document.getElementById("addForm").reset();
    });

    // ===== INITIAL LOAD =====
    loadCatalog();
});
