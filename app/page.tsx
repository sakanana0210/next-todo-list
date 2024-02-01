"use client";
import React, { useState, useEffect } from 'react';

interface Task {
  id: number;
  name: string;
  description: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

const Home = () => {
  const [loadDown, setLoadDown] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alltasks, setAllTasks] = useState<Task[]>([]);
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  const [dataupdated, setDataUpdated] = useState<boolean>(false);

  const fetchTasks = async (page = 1, type = 'all')  => {
    try {
      if(page === 1){
        setAllTasks([]);
      }
      const queryParams = new URLSearchParams({ page: page.toString(), type }).toString();
      const response = await fetch(`https://wayi.league-funny.com/api/task?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 200) {
        const data = await response.json();
        setAllTasks(prevTasks => [...prevTasks, ...data.data]);

        if (data.data.length < 10) {
          setDataUpdated(true);
          return;
        } else {
          fetchTasks(page + 1, type);
          return;
        }
        
      } else {
        alert('系統發生錯誤，請稍後再試。');
      }
    } catch (error) {
      console.error('fetchTasks錯誤:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();

    if (!name.trim()){
      return alert('任務名稱必填，請重新確認。');
    }

    // 新增任務
    if(selectedTaskId === 0){
      try {
        
        const taskData = {
          name: name.trim(),
          description: description.trim(),
          is_completed: false,
          created_at: now,
          updated_at: now
        };

        const response = await fetch('https://wayi.league-funny.com/api/task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });
  
        if (response.status === 200) {
          const responseData = await response.json();
          console.log(responseData);
          alert('任務創建成功！');
          setAllTasks(prevTasks => [...prevTasks, responseData.data]);
          setDataUpdated(true);
          setName('');
          setDescription('');
        } else if (response.status === 400) {
          alert('請輸入任務名稱、任務名稱長度不得超過10個字、任務描述長度不得超過100個字。');
        } else if (response.status === 500) {
          alert('系統發生錯誤，請稍後再試。');
        }
  
      } catch (error) {
        console.error('handleSubmit錯誤:', error);
      }
    } else {
    
    // 編輯任務
      try {
        const taskData = {
          name: name.trim(),
          description: description.trim(),
          updated_at: now
        };

        const response = await fetch(`https://wayi.league-funny.com/api/task/${selectedTaskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });

        if (response.status === 200) {
          alert('任務編輯成功！');
          setAllTasks(prevTasks => prevTasks.map(task => {
            if (task.id === selectedTaskId) {
              return { ...task, ...taskData };
            }
            return task;
          }));
          setDataUpdated(true);
          setName('');
          setDescription('');
          setSelectedTaskId(0);
        } else if (response.status === 400) {
          alert('請輸入任務名稱、任務名稱長度不得超過10個字、任務描述長度不得超過100個字。');
        } else if (response.status === 404) {
          alert('任務不存在。');
          setSelectedTaskId(0);
        } else if (response.status === 500) {
          alert('系統發生錯誤，請稍後再試。');
        }
      } catch (error) {
        console.error('handleSubmit錯誤:', error);
      }
    }

  };

  // 切換完成/未完成
  const toggleCompleted = async (task: Task) => {
    const id = task.id;
    const response = await fetch('https://wayi.league-funny.com/api/task/' + id, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.status === 200) {
      setAllTasks(prevTasks => prevTasks.map(task => {
        if (task.id === id) {
          return { ...task, is_completed: !task.is_completed };
        }
        return task;
      }));
      setDataUpdated(true);
    } else if (response.status === 404) {
      alert('任務不存在。');
    } else if (response.status === 500) {
      alert('系統發生錯誤，請稍後再試。');
    }
  }

  // 選擇編輯任務
  const handleEdit = (task: Task) => {
    if (task && task.id) {
      setSelectedTaskId(task.id);
      setName(task.name);
      setDescription(task.description);
    }
  }

  // 刪除任務
  const handleDelete = async (task: Task) => {
    const id = task.id;
    const response = await fetch('https://wayi.league-funny.com/api/task/' + id, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const filterdTask = alltasks.filter((t) => t.id !== id);

    if (response.status === 204) {
      alert('刪除成功！');
      setAllTasks(filterdTask);
      setDataUpdated(true);
    } else if (response.status === 404) {
      alert('任務不存在。');
    } else if (response.status === 500) {
      alert('系統發生錯誤，請稍後再試。');
    }
  }

  // 切換不隱藏完成任務 or 隱藏完成任務 
  const handleHideCompleted = () => {
    setHideCompleted(!hideCompleted);
  }

  useEffect(()=>{
    setLoadDown(true);
  }, []);

  useEffect(()=>{
    if(loadDown){
      fetchTasks(1, 'all');
    }
  }, [loadDown]);

  useEffect(()=>{
    if(loadDown && dataupdated ){
      console.log("dataupdated");
      if(hideCompleted){
        const uncompletedTasks = alltasks.filter((task) => task.is_completed === false);
        setTasks(uncompletedTasks);
        setDataUpdated(false);
      } else {
        setTasks(alltasks);
        setDataUpdated(false);
      }
    } else if (loadDown && hideCompleted){
      const uncompletedTasks = alltasks.filter((task) => task.is_completed === false);
      setTasks(uncompletedTasks);
      setDataUpdated(false);
    } else if (loadDown){
      setTasks(alltasks);
      setDataUpdated(false);
    }
  }, [loadDown, dataupdated, hideCompleted]);


  return (
    <div className="container mx-auto px-8 py-10">
      <h1 className="mb-3 text-3xl font-semibold text-gray-700 ">ToDo List</h1>
      
      <form className="space-y-6 bg-white p-4 shadow-md rounded-lg" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">任務名稱</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">任務描述</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            新增/編輯任務
          </button>
        </div>
      </form>
      <div className="mt-8">
        <div className="flex justify-between">
          <h2 className="text-xl font-bold mb-4 text-gray-700">任務清單</h2>
          <button onClick={handleHideCompleted} className=" mr-4 mb-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            {hideCompleted ? '顯示完成任務' : '隱藏完成任務' }
          </button>
        </div>
        <ul className="bg-white shadow-md rounded-lg divide-y divide-gray-200">
          {tasks.map((task) => (
            <li key={task.id} className="px-4 py-4 flex justify-between items-center">
              <div className="space-y-2">
                <p className="font-bold text-gray-900">{task.name}</p>
                <p className="text-sm text-gray-700">{task.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span onClick={() => toggleCompleted(task)} className={`px-3 inline-flex text-xs leading-6 font-semibold rounded-full ${task.is_completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {task.is_completed ? '已完成' : '未完成'}
                </span>
                <button onClick={() => handleEdit(task)} className="text-indigo-600 hover:text-indigo-900">編輯</button>
                <button onClick={() => handleDelete(task)} className="text-red-600 hover:text-red-900">刪除</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;