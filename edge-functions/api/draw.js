let pool = {
  taskList: [],
  drawnIndex: new Set()
};
const ADMIN_PWD = "6471B&21";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const pwd = url.searchParams.get("pwd");
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    if (action === "init" && request.method === "POST") {
      const body = await request.json();
      const tasks = body.tasks;
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return Response.json({ success: false, msg: "任务列表不能为空" }, { headers });
      }
      const shuffle = arr => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };
      pool = {
        taskList: shuffle(tasks),
        drawnIndex: new Set()
      };
      return Response.json({ success: true, msg: "✅任务池初始化完成" }, { headers });
    }

    if (action === "reset" && request.method === "POST") {
      pool = { taskList: [], drawnIndex: new Set() };
      return Response.json({ success: true, msg: "✅全部清空" }, { headers });
    }

    if (action === "resetDrawn" && request.method === "POST") {
      if (pwd !== ADMIN_PWD) {
        return Response.json({ success: false, msg: "密码错误" }, { headers });
      }
      pool.drawnIndex.clear();
      return Response.json({ success: true, msg: "✅抽取记录已重置，任务保留" }, { headers });
    }

    if (action === "draw" && request.method === "GET") {
      const total = pool.taskList.length;
      if (total === 0) {
        return Response.json({ success: false, msg: "任务池还没有初始化" }, { headers });
      }
      if (pool.drawnIndex.size >= total) {
        return Response.json({ success: false, msg: "所有任务已经抽完啦" }, { headers });
      }
      let pickIndex;
      do {
        pickIndex = Math.floor(Math.random() * total);
      } while (pool.drawnIndex.has(pickIndex));
      pool.drawnIndex.add(pickIndex);
      const myTask = pool.taskList[pickIndex];
      return Response.json({ success: true, task: myTask }, { headers });
    }

    if (action === "getStatus" && request.method === "GET") {
      if (pwd !== ADMIN_PWD) {
        return Response.json({ success: false, msg: "密码错误" }, { headers });
      }
      return Response.json({
        success: true,
        total: pool.taskList.length,
        drawnCount: pool.drawnIndex.size
      }, { headers });
    }

    return Response.json({ success: false, msg: "非法操作" }, { headers });
  } catch (err) {
    return Response.json({ success: false, msg: "后端异常：" + err.message }, { headers });
  }
}
