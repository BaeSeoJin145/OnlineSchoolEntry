// ==================== Firebase 초기화 ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, get, update, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
const firebaseConfig = {
  apiKey: "AIzaSyBWVZERDb9xbfqCzG3bZvRIciCslbhGTD4",
  authDomain: "entry-4a14b.firebaseapp.com",
  databaseURL: "https://entry-4a14b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "entry-4a14b",
  storageBucket: "entry-4a14b.firebasestorage.app",
  messagingSenderId: "262491101728",
  appId: "1:262491101728:web:c67d03020d7e753e07ba45",
  measurementId: "G-V45QGJ3D8E"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
// ==================== 공통 함수 ====================
// 학년, 반 추출 함수
function parseGradeClass(id) {
  if (!id) return null;
  const idStr = String(id);
  let grade, classNum;
  if (idStr.length === 5) {
    grade = idStr.slice(0, 2);
    classNum = idStr.slice(2, 3);
  } else if (idStr.length === 4) {
    grade = idStr.slice(0, 1);
    classNum = idStr.slice(1, 2);
  } else {
    grade = idStr.slice(0, 1);
    classNum = idStr.slice(1, 2);
  }
  return { grade, classNum };
}
// 로그인 상태 확인
let isLoggedIn = false;
// 전역 변수로 로그인한 선생님 이름 저장
let currentTeacherName = '';
// 로그인 함수
async function teacherLogin(email, password) {
  try {
    const teacherRef = ref(db, 'teacher');
    const snapshot = await get(teacherRef);
    
    if (snapshot.exists()) {
      const teachers = snapshot.val();
      
      for (const teacherName in teachers) {
        const teacher = teachers[teacherName];
        if (teacher.email === email && teacher.password === password) {
          currentTeacherName = teacherName; // 로그인한 선생님 이름 저장
          console.log('현재 선생님 이름:', currentTeacherName);
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error("로그인 오류:", error);
    return false;
  }
}

// 로그인 모달 표시
function showLoginModal() {
  const modal = document.getElementById('loginModal');
  const content = document.getElementById('content');
  modal.style.display = 'flex';
  content.style.display = 'none';
  
  // 로그인 버튼 이벤트
  document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('teacherEmail').value.trim();
    const password = document.getElementById('teacherPassword').value.trim();
    
    if (!email || !password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    const success = await teacherLogin(email, password);
    if (success) {
      isLoggedIn = true;
      modal.style.display = 'none';
      content.style.display = 'block';
      // 페이지 초기화 함수 호출 제거 (이미 DOMContentLoaded에서 처리됨)
    } else {
      alert('이메일 또는 비밀번호가 잘못되었습니다.');
    }
  });
}
// ==================== 학생 페이지 기능 ====================
function setupStudentPage() {
  // 출입 요청 데이터 저장 함수
  async function uploadStudentData() {
    const studentId = document.getElementById("studentId")?.value;
    const studentName = document.getElementById("studentName")?.value;
    const studentDate = document.getElementById("studentDate")?.value;
    const studentReason = document.getElementById("studentReason")?.value;
    const studentTeacher = document.getElementById("studentTeacher")?.value;

    if (!studentId || !studentName || !studentDate || !studentReason || !studentTeacher) {
      alert("모든 필드를 입력해주세요!");
      return;
    }

    const gc = parseGradeClass(studentId);
    if (!gc) return;

    // 1. 먼저 해당 학번이 DB에 존재하는지 확인
    const classPath = `class/${gc.grade}-${gc.classNum}/${studentId}`;
    const classRef = ref(db, classPath);
    
    try {
      const snapshot = await get(classRef);
      
      if (!snapshot.exists()) {
        alert("존재하지 않는 학번입니다. 학번을 다시 확인해주세요!");
        return;
      }

      // 2. 학번이 존재하면 출입 요청 처리
      const dbPath = `class/${gc.grade}-${gc.classNum}/${studentId}/${studentDate}`;
      const dbRef = ref(db, dbPath);

      const studentData = {
        name: studentName,
        reason: studentReason,
        accept: false,
        enterTime: "없음",
        leaveTime: "없음",
        realEnter: false,
        teacher: studentTeacher
      };

      await set(dbRef, studentData);
      alert("출입 요청이 완료되었습니다!");
      const requestForm = document.getElementById("requestForm");
      if (requestForm) requestForm.style.display = "none";
      
    } catch (error) {
      alert(`오류 발생: ${error.message}`);
    }
  }

// 학생 정보 표시 함수
function displayStudentInfo() {
  const studentInfoElem = document.getElementById('studentInfo');
  const circleCheck = document.getElementById('circleCheck');
  if (!studentInfoElem) return;
  if (!circleCheck) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const date = params.get('date');

  if (id && date) {
    const gc = parseGradeClass(id);
    if (!gc) {
      studentInfoElem.innerHTML = "잘못된 학번 형식입니다.";
      return;
    }

    const path = `/class/${gc.grade}-${gc.classNum}/${id}/${date}`;
    const dbRef = ref(db, path);

    get(dbRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const name = data.name || "(이름 정보 없음)";
        const reason = data.reason || "(사유 정보 없음)";
        const teacher = data.teacher || "(지도 교사 정보 없음)";
        // boolean 값 처리
        const accept = typeof data.accept === 'boolean' 
          ? data.accept 
            ? "허가됨(Đã được chấp nhận)" 
            : "거부됨(Đã bị từ chối)"
          : data.accept || "승인 대기 중(Đang chờ phê duyệt)";

        const realEnter = typeof data.realEnter === 'boolean' 
          ? data.realEnter
            ? "사용함(Đã sử dụng)" 
            : "사용 안 함(Không sử dụng)" 
          : data.realEnter || "미확인(Chưa xác nhận)";

        // circleCheck 색상 변경 조건
        if (data.accept === true && data.realEnter === false) {
          circleCheck.style.backgroundColor = "green";
        } else {
          circleCheck.style.backgroundColor = "#810707"; // 다른 경우는 회색 유지
        }

        studentInfoElem.innerHTML =
          `학번(Mã số lớp): ${id}
          <br>이름(Họ tên): ${name}
          <br>날짜(Ngày hôm nay): ${date}
          <br>사유(Lý do): ${reason}
          <br>지도 교사(GV chủ nhiệm): ${teacher}
          <br>출입 여부(Ra vào): ${accept}
          <br>사용 여부(Đã sử dụng): ${realEnter}`;
      } else {
        studentInfoElem.innerHTML = "해당 날짜에 대한 데이터가 없습니다.(KHÔNG CÓ DỮ LIỆU CHO NGÀY NÀY.)";
      }
    }).catch((error) => {
      studentInfoElem.innerHTML = `데이터 조회 중 오류가 발생했습니다(ĐÃ XẢY RA LỖI KHI TRUY XUẤT DỮ LIỆU): ${error}`;
      console.error(error);
    });
  } else {
    studentInfoElem.innerHTML = "정보가 없습니다.(KHÔNG CÓ THÔNG TIN.)";
  }
}

  // 학생 페이지 이벤트 리스너 설정
  const uploadBtn = document.getElementById("uploadStudentData");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", uploadStudentData);
  }

  const requestPageBtn = document.getElementById("requestPageBtn");
  if (requestPageBtn) {
    requestPageBtn.addEventListener("click", () => {
      const requestForm = document.getElementById("requestForm");
      if (requestForm) requestForm.style.display = "block";
    });
  }

  displayStudentInfo();
}
// ==================== 페이지 이동 핸들러 ====================

function setupPageNavigation() {
  const pages = [
    { 
      id: 'go-student-btn', 
      url: 'student.html'
    },
    { 
      id: 'go-teacher-btn', 
      url: 'teacher.html'
    }
  ];

  pages.forEach(page => {
    const btn = document.getElementById(page.id);
    if (btn) {
      btn.addEventListener('click', () => {
        window.location.href = page.url;
      });
    }
  });
}
// ==================== 검색 기능 ====================

function setupSearchFunction() {
  const saveCategoryBtn = document.getElementById("saveCategory");
  if (!saveCategoryBtn) return;

  saveCategoryBtn.addEventListener("click", async () => {
    const selectedDate = document.getElementById("studentDefDate")?.value;
    if (!selectedDate) {
      console.warn("날짜를 선택해주세요.");
      return;
    }

    console.log("✅선택한 날짜:", selectedDate);

    const classRef = ref(db, "class");
    try {
      const snapshot = await get(classRef);
      const listContainer = document.getElementById("listofStudents");
      if (!listContainer) return;
      
      listContainer.innerHTML = "";

      if (!snapshot.exists()) {
        console.warn("⚠️ class 경로에 데이터가 없습니다.");
        return;
      }

      const classes = snapshot.val();
      let foundCount = 0;

      for (const className in classes) {
        console.log("📁 반:", className);
        const students = classes[className];

        for (const studentId in students) {
          const dateEntries = students[studentId];

          if (dateEntries[selectedDate]) {
            const studentData = dateEntries[selectedDate];
            const studentName = studentData.name || "이름 없음";
            const reason = studentData.reason || "사유 없음";
            const teacher = studentData.teacher || "지도 교사 없음";
            const enterTime = studentData.enterTime || "출입 시간 없음";
            const leaveTime = studentData.leaveTime || "퇴실 시간 없음";
            const accept = studentData.accept !== undefined && studentData.accept !== null 
              ? studentData.accept 
              ? "허가" 
              : "거부"
              : "허가 여부 없음";
            const realEnter = studentData.realEnter !== undefined && studentData.realEnter !== null
              ? studentData.realEnter
              ? "사용 완료"
              : "사용 안함"
              : "실제 출입 여부 없음";

            const studentDiv = document.createElement("div");
            studentDiv.innerHTML = `
              <h3><strong>${className} | ${studentId}</strong></h3>
              <h3>이름: ${studentName}</h3>
              <h3>사유: ${reason}</h3>
              <h3>지도 교사: ${teacher}</h3>
              <h3>출입 시간: ${enterTime}</h3>
              <h3>퇴실 시간: ${leaveTime}</h3>
              <h3>허가 여부: ${accept}</h3>
              <h3>실제 출입 여부: ${realEnter}</h3>
              <input type="checkbox" id="accept"></input>
              <hr/>
            `;

            listContainer.appendChild(studentDiv);
            foundCount++;
          }
        }
      }

      if (foundCount === 0) {
        console.warn("⚠️ 선택한 날짜에 해당하는 학생 정보가 없습니다.");
      } else {
        console.log(`✅ 검색 완료: ${foundCount}명`);
      }
    } catch (error) {
      console.error("❌ 데이터 불러오기 오류:", error);
    }
  });
}


// ==================== 출입 시간 기록 기능 ====================

// 베트남 호치민 시간 반환 함수 (UTC+7)
function getVietnamTime() {
  const now = new Date();
  // UTC 시간에 7시간 추가 (호치민 시간)
  now.setHours(now.getHours() + 7);
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

function setupEntryExitButtons() {
  const enterBtn = document.getElementById('enter-btn');
  const leaveBtn = document.getElementById('leave-btn');

  if (enterBtn && leaveBtn) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const date = params.get('date');

    if (!id || !date) {
      console.error('학번 또는 날짜 정보가 없습니다.');
      return;
    }

    const gc = parseGradeClass(id);
    if (!gc) return;

    const dbPath = `/class/${gc.grade}-${gc.classNum}/${id}/${date}`;
    const dbRef = ref(db, dbPath);

    // Firebase에서 현재 데이터 가져오기
    get(dbRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        // 조건 확인: accept === true && realEnter === false
        if (data.accept === true && data.realEnter !== true) {
          // 입장 버튼 활성화 및 이벤트 연결
          enterBtn.style.display = 'inline-block'; // 보이기
          enterBtn.addEventListener('click', () => {
            const updates = {
              realEnter: true,
              enterTime: getVietnamTime()
            };

            update(dbRef, updates)
              .then(() => {
                alert('입장 시간이 기록되었습니다!\nThời gian vào đã được ghi lại!');
                location.reload();
              })
              .catch((error) => {
                alert(`오류 발생: ${error.message}\nLỗi: ${error.message}`);
              });
          });
        } else {
          enterBtn.style.display = 'none'; // 조건 불일치 시 숨기기
        }

        // leaveBtn은 항상 보이게 하거나, 따로 조건 추가 가능
        leaveBtn.addEventListener('click', () => {
          const updates = {
            leaveTime: getVietnamTime()
          };

          update(dbRef, updates)
            .then(() => {
              alert('퇴실 시간이 기록되었습니다!\nThời gian ra đã được ghi lại!');
              location.reload();
            })
            .catch((error) => {
              alert(`오류 발생: ${error.message}\nLỗi: ${error.message}`);
            });
        });
      } else {
        console.error('데이터가 존재하지 않습니다.');
      }
    }).catch((error) => {
      console.error('데이터를 가져오는 중 오류 발생:', error);
    });
  }
}
// ==================== 초기화 ====================
document.addEventListener("DOMContentLoaded", () => {


  if (document.getElementById('studentTeacher')) {
    loadTeacherList();
  }

  setupEntryExitButtons();
  // 현재 페이지에 따라 필요한 기능만 초기화
  if (document.getElementById('studentInfo') || document.getElementById('uploadStudentData')) {
    setupStudentPage();
  }
  
  if (document.getElementById('go-student-btn') || document.getElementById('go-teacher-btn')) {
    setupPageNavigation();
  }
  
  if (document.getElementById('saveCategory')) {
    setupSearchFunction();
  }

    // QR 생성 날짜 필드 자동 설정 추가 (이 부분만 새로 추가)
  const qrDateInput = document.getElementById('qrStudentDate');
  const studentDefDateInput = document.getElementById('studentDefDate');
  
  if (qrDateInput) {
    const today = new Date();
    today.setHours(today.getHours() + 7); 
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    qrDateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  if (studentDefDateInput) {
    const today = new Date();
    today.setHours(today.getHours() + 7); 
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    studentDefDateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  const saveCategoryBtn = document.getElementById('saveCategory');
  const selectAllCheckbox = document.getElementById('selectAll');
  const saveBtn = document.getElementById('save');

  if (saveCategoryBtn) saveCategoryBtn.addEventListener('click', searchStudents);
  if (selectAllCheckbox) selectAllCheckbox.addEventListener('change', toggleAllCheckboxes);
  if (saveBtn) saveBtn.addEventListener('click', updateStudentApprovals);
  
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
  showLoginModal();
  }
});
// 학생 검색 함수
async function searchStudents() {
  const selectedGrade = document.getElementById('studentDefGrade').value;
  const selectedEnter = document.getElementById('studentDefEnter').value;
  const selectedRequest = document.getElementById('studentDefRequest').value;
  const selectedDate = document.getElementById('studentDefDate').value;

  try {
    const classRef = ref(db, 'class');
    const snapshot = await get(classRef);
    const listContainer = document.getElementById('listofStudents');
    listContainer.innerHTML = '';

    if (!snapshot.exists()) {
      listContainer.innerHTML = '<div class="no-data">데이터가 없습니다.</div>';
      return;
    }

    const classes = snapshot.val();
    let foundCount = 0;

    // 학년-반으로 필터링 (예: "7-1", "11-3" 등)
    for (const classKey in classes) {
      // 학년 필터링 (예: "7-1"에서 "7"만 추출)
      const grade = classKey.split('-')[0];
      if (selectedGrade && grade !== selectedGrade) continue;

      const students = classes[classKey];
      for (const studentId in students) {
        const dateEntries = students[studentId];
        if (!dateEntries[selectedDate]) continue;

        const studentData = dateEntries[selectedDate];
        
        // 선생님 이름 필터링
        console.log('현재 teacherName:', currentTeacherName);
        console.log('이 학생의 teacher:', studentData.teacher);

        if (studentData.teacher !== currentTeacherName) continue;

        // 출입 허가 여부 필터링
        if (selectedEnter && String(studentData.accept) !== selectedEnter) continue;
        
        // 요청 상태 필터링 (realEnter 기준)
        if (selectedRequest === 'used' && !studentData.realEnter) continue;
        if (selectedRequest === 'unused' && studentData.realEnter) continue;

        displayStudentItem(classKey, studentId, selectedDate, studentData);
        foundCount++;
      }
    }

    if (foundCount === 0) {
      listContainer.innerHTML = '<div class="no-data">검색 결과가 없습니다.</div>';
    }
  } catch (error) {
    console.error('검색 오류:', error);
    alert('학생 검색 중 오류가 발생했습니다.');
  }
}
// 학생 정보 표시 함수
function displayStudentItem(classKey, studentId, date, studentData) {
  const listContainer = document.getElementById('listofStudents');
  const studentDiv = document.createElement('div');
  studentDiv.className = 'student-item';
  studentDiv.dataset.class = classKey;
  studentDiv.dataset.id = studentId;
  studentDiv.dataset.date = date;

  studentDiv.innerHTML = `
    <div class="student-info">
      <input type="checkbox" id="chk-${studentId}" class="student-check">
      <label for="chk-${studentId}">
        <strong>${classKey} | ${studentId}</strong> - ${studentData.name || '이름 없음'}
      </label>
    </div>
    <div class="student-details">
      <span>사유: ${studentData.reason || '사유 없음'}</span>
      <span>출입 상태: ${getStatusText(studentData.accept, 'accept')}</span>
      <span>출입증 사용 여부: ${getStatusText(studentData.realEnter, 'realEnter')}</span>
      <span>담당 교사: ${studentData.teacher || '미지정'}</span>
      <span>출입: ${studentData.enterTime || '없음'}</span>
      <span>퇴실: ${studentData.leaveTime || '없음'}</span>
    </div>
  `;

  listContainer.appendChild(studentDiv);
}
// 상태 텍스트 변환 함수
function getStatusText(value, type) {
  if (value === undefined || value === null) return '정보 없음';
  
  if (type === 'accept') {
    return value ? '허가됨' : '거부됨';
  } else if (type === 'realEnter') {
    return value ? '사용 완료' : '사용 안함';
  }
  return String(value);
}
// 전체 선택/해제 함수
function toggleAllCheckboxes() {
  const isChecked = document.getElementById('selectAll').checked;
  const checkboxes = document.querySelectorAll('.student-check');
  checkboxes.forEach(checkbox => {
    checkbox.checked = isChecked;
  });
}

// 출입 허가 업데이트 함수
async function updateStudentApprovals() {

  const selectedStudents = document.querySelectorAll('.student-check:checked');
  if (selectedStudents.length === 0) {
    alert('학생을 선택해주세요.');
    return;
  }

  try {
    const updates = {};
    
    selectedStudents.forEach(checkbox => {
      const studentItem = checkbox.closest('.student-item');
      const classKey = studentItem.dataset.class;
      const studentId = studentItem.dataset.id;
      const date = studentItem.dataset.date;
      
      // 업데이트 경로 설정
      const dbPath = `class/${classKey}/${studentId}/${date}`;
      updates[`${dbPath}/accept`] = true;
    });

    // Firebase에 일괄 업데이트
    await update(ref(db), updates);
    alert(`${selectedStudents.length}명의 학생 출입이 허가되었습니다.`);
    
    
    searchStudents(); // 목록 새로고침
  } catch (error) {
    console.error('업데이트 오류:', error);
    alert('학생 정보 업데이트 중 오류가 발생했습니다.');
  }
}
// ==================== 선생님 목록 로드 ====================
async function loadTeacherList() {
  const teacherSelect = document.getElementById('studentTeacher');
  if (!teacherSelect) return;

  try {
    const teacherRef = ref(db, 'teacher');
    const snapshot = await get(teacherRef);

    // 기존 옵션 완전 초기화 (기본 옵션 없음)
    teacherSelect.innerHTML = '';

    if (snapshot.exists()) {
      const teacherData = snapshot.val();
      
      // 객체인 경우 키-값 쌍 처리
      if (typeof teacherData === 'object' && !Array.isArray(teacherData)) {
        Object.entries(teacherData).forEach(([key, value]) => {
          const option = document.createElement('option');
          option.value = key; // 선생님 ID 또는 키
          
          // 값이 객체인 경우 name 속성 확인, 아니면 값 그대로 사용
          if (value && typeof value === 'object' && value.name) {
            option.textContent = value.name;
          } else if (typeof value === 'string') {
            option.textContent = value;
          } else {
            option.textContent = key; // 최후의 방법으로 키 사용
          }
          
          teacherSelect.appendChild(option);
        });
      }
      // 배열인 경우
      else if (Array.isArray(teacherData)) {
        teacherData.forEach((teacher, index) => {
          const option = document.createElement('option');
          option.value = index; // 배열 인덱스
          option.textContent = teacher.name || teacher || `선생님 ${index + 1}`;
          teacherSelect.appendChild(option);
        });
      }
    } else {
      console.warn('선생님 데이터가 없습니다.');
      // 데이터 없을 때 빈 상태 유지 또는 메시지 추가 가능
    }
  } catch (error) {
    console.error('선생님 목록 로드 오류:', error);
    // 오류 시 빈 상태 유지
  }
}