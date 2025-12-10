// ====== 全局任务列表 ======
let taskList = JSON.parse(localStorage.getItem("tasks") || "[]");

// ====== 日历控制变量 (追踪当前显示的月份) ======
// 初始化为当前日期
let currentDate = new Date(); 

// ====== 初始化 ======
document.addEventListener("DOMContentLoaded", () => {
    // 初始渲染
    renderTasks();
    renderCalendar();

    // 绑定事件
    document.getElementById("addTaskBtn").addEventListener("click", addTask);
    document.getElementById("prevMonthBtn").addEventListener("click", () => changeMonth(-1));
    document.getElementById("nextMonthBtn").addEventListener("click", () => changeMonth(1));
    document.getElementById("todayBtn").addEventListener("click", goToToday);
});

// ====== 切换月份的函数 ======
function changeMonth(delta) {
    // 设置新的月份
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

// ====== 返回今天的函数 ======
function goToToday() {
    currentDate = new Date(); // 重置为当前月份
    renderCalendar();
}

// ====== 添加任务 ======
function addTask() {
    const name = document.getElementById("taskName").value;
    const date = document.getElementById("taskDate").value;
    const color = document.getElementById("taskColor").value; 

    if (!name || !date) {
        alert("Please enter both task name and deadline date.");
        return;
    }

    taskList.push({ name, date, color, completed: false });
    saveTasks(); // saveTasks 会调用 renderTasks 进行排序和渲染

    document.getElementById("taskName").value = "";
    document.getElementById("taskDate").value = "";
}

// ====== 保存并重新渲染 ======
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(taskList));
    renderTasks();
    renderCalendar();
}

// ====== 计算剩余天数和过期状态 ======
function calculateDaysLeft(deadlineDate) {
    const today = new Date();
    const deadline = new Date(deadlineDate);
    deadline.setHours(0, 0, 0, 0); 
    today.setHours(0, 0, 0, 0);

    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: "Today!", isOverdue: false };
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} days ago (Expired)`, isOverdue: true };
    return { text: `${diffDays} days left`, isOverdue: false };
}


// ====== 渲染左侧任务列表 (新增排序功能) ======
function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";
    
    // 【新增功能：按日期排序】
    // 使用 sort() 方法，将日期字符串转换为 Date 对象进行比较
    const sortedTaskList = [...taskList].sort((a, b) => {
        // 先比较日期，确保日期是有效的
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // 如果日期有效，则按时间戳排序
        if (dateA && dateB) {
            return dateA.getTime() - dateB.getTime();
        }
        // 如果日期无效，保持原顺序
        return 0;
    });


    sortedTaskList.forEach((task, index) => {
        // 注意：这里的 index 是 sortedTaskList 中的索引，但 deleteTask 传入的是原始 taskList 的索引
        // 为了确保删除操作的准确性，我们需要找到该任务在原始 taskList 中的索引
        const originalIndex = taskList.findIndex(t => t.name === task.name && t.date === task.date && t.color === task.color);

        const li = document.createElement("li");
        li.className = "task-item";
        
        const { text: daysLeft, isOverdue } = calculateDaysLeft(task.date);

        // 过期任务高亮
        if (isOverdue && !task.completed) {
            li.classList.add('overdue');
        }

        // 使用任务的颜色设置边框
        li.style.borderLeft = `5px solid ${task.color}`;

        li.innerHTML = `
            <span class="${task.completed ? "completed" : ""}">
                ${task.name} — ${task.date}
                <br><small>Deadline: <strong>${daysLeft}</strong></small>
            </span>
            <div class="task-actions">
                <button class="edit-btn" onclick="openEditModal(${originalIndex})">Edit</button>
                <button onclick="deleteTask(${originalIndex})">X</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// ====== 打开编辑弹窗 (简化为 prompt) ======
function openEditModal(index) {
    const task = taskList[index];

    let newName = prompt("Enter new task name:", task.name);
    if (newName === null || newName.trim() === "") {
        return; 
    }
    newName = newName.trim();

    let newColor = prompt("Enter new task color (e.g., #ff0000 or red):", task.color);
    if (newColor === null || newColor.trim() === "") {
        newColor = task.color; 
    }

    taskList[index].name = newName;
    taskList[index].color = newColor.trim();
    
    saveTasks();
    alert("Task updated successfully!");
}


// ====== 删除任务 ======
function deleteTask(i) {
    taskList.splice(i, 1);
    saveTasks();
}

// ====== 渲染日历 (现在使用 currentDate 变量) ======
function renderCalendar() {
    const calendarContainer = document.getElementById("calendar");
    const monthTitleElement = document.getElementById("monthTitle");
    
    calendarContainer.innerHTML = ""; // 清空日历内容

    // 使用全局变量 currentDate 获取要渲染的月份
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); 
    
    // 获取'今天'的日期信息 (用于高亮标记)
    const todayReference = new Date();
    const today = todayReference.getDate();
    const currentMonth = todayReference.getMonth();
    const currentYear = todayReference.getFullYear();

    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    
    // 更新月份标题
    monthTitleElement.innerText = `${monthNames[month]} ${year}`; 

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const offset = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);

    // 1. 添加星期的头部
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    weekDays.forEach(dayName => {
        const dayHeader = document.createElement("div");
        dayHeader.className = "calendar-header";
        dayHeader.innerText = dayName;
        calendarContainer.appendChild(dayHeader);
    });

    // 2. 插入空格子
    for (let i = 0; i < offset; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        calendarContainer.appendChild(empty);
    }

    // 3. 渲染日期格子
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day";
        cell.innerText = day;
        
        // 高亮今天 (粉色)
        if (day === today && month === currentMonth && year === currentYear) {
            cell.classList.add('today-highlight');
        }

        // 查找当天所有的任务
        const tasksOnDay = taskList.filter(task => {
            const dateParts = task.date.split('-'); 
            if (dateParts.length === 3) {
                const taskYear = parseInt(dateParts[0]);
                const taskMonth = parseInt(dateParts[1]) - 1; 
                const taskDay = parseInt(dateParts[2]);

                return taskYear === year && taskMonth === month && taskDay === day;
            }
            return false;
        });

        // 渲染任务标记（多任务堆叠显示）
        if (tasksOnDay.length > 0) {
            const maxMarkers = Math.min(tasksOnDay.length, 3);
            const taskMarkersContainer = document.createElement("div");
            taskMarkersContainer.className = "task-markers-container";

            for (let i = 0; i < maxMarkers; i++) {
                const task = tasksOnDay[i];
                const marker = document.createElement("div");
                marker.className = "task-marker-stacked";
                marker.style.backgroundColor = task.color;
                marker.style.transform = `translate(calc(-50% + ${i * 2}px), calc(-50% + ${i * 2}px))`; 
                taskMarkersContainer.appendChild(marker);
            }

            if (tasksOnDay.length > maxMarkers) {
                 const count = document.createElement("span");
                 count.className = "task-count";
                 count.innerText = `+${tasksOnDay.length - maxMarkers}`;
                 taskMarkersContainer.appendChild(count);
            }
            
            cell.appendChild(taskMarkersContainer);
        }

        calendarContainer.appendChild(cell);
    }
}
