"""Optional touch UI smoke. Requires an existing Expo Web harness and Python Playwright.
No production web dependency/configuration is added by this script. Audio is muted.
"""
import json, math, os
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(viewport={"width":390,"height":844},has_touch=True)
 context.add_init_script("localStorage.setItem('@game1000/settings/audio/v1', JSON.stringify({bgm:false,se:false,bgmVolume:.32,seVolume:.7}));")
 page=context.new_page()
 errors=[]
 page.on("pageerror",lambda e:errors.append(str(e)))
 page.goto(os.environ.get('CASCADE_WEB_URL','http://localhost:8100')+'/play/008',wait_until='networkidle')
 checks=[]
 def check(name):
  checks.append(name); print('PASS',name,flush=True)
 def fire(angle):
  page.wait_for_timeout(500)
  resume=page.get_by_role('button',name='ゲームに戻る',exact=True)
  if resume.is_visible(): resume.click()
  page.get_by_text('狙う → 指を離して発射',exact=True).wait_for()
  box=page.get_by_test_id('cascade-field').bounding_box(); scale=box['width']/360
  print('FIRE',box,flush=True)
  page.touchscreen.tap(box['x']+(180+math.tan(angle)*92)*scale,box['y']+480*scale)
 def clear():
  page.get_by_text('クリア！',exact=True).wait_for(timeout=23000)
 page.get_by_role('button',name='ステージ1 はじめの連鎖、星0個',exact=True).click()
 page.get_by_test_id('cascade-field').wait_for()
 fire(.5); page.wait_for_timeout(400)
 if not page.get_by_role('button',name='ゲームに戻る',exact=True).is_visible():
  page.get_by_role('button',name='一時停止',exact=True).click()
 page.get_by_role('button',name='ゲームに戻る',exact=True).wait_for()
 frozen=page.get_by_test_id('cascade-field').inner_html()
 page.wait_for_timeout(500)
 assert frozen==page.get_by_test_id('cascade-field').inner_html()
 check('pause freezes rendered field')
 page.get_by_role('button',name='最初から',exact=True).click()
 page.get_by_role('button',name='キャンセル',exact=True).click()
 page.get_by_role('button',name='ゲームに戻る',exact=True).click()
 clear(); check('touch launch clears stage 1 after pause/cancel/resume')
 page.get_by_label('星3個',exact=True).wait_for()
 page.screenshot(path='/tmp/cascade-web-result.png')
 page.get_by_role('button',name='ステージ選択へ',exact=True).click()
 page.get_by_role('button',name='ステージ2 壁の向こう、星0個',exact=True).wait_for()
 page.reload(wait_until='networkidle')
 page.get_by_role('button',name='ステージ1 はじめの連鎖、星3個',exact=True).wait_for()
 page.get_by_role('button',name='ステージ2 壁の向こう、星0個',exact=True).click()
 check('stars and stage 2 unlock survive reload')
 fire(-.4); clear();check('stage 2 clears using side reflection')
 page.get_by_role('button',name='ステージ選択へ',exact=True).click()
 page.get_by_role('button',name='エンドレスで遊ぶ',exact=True).click()
 fire(.5);clear();check('endless wave 1 clear')
 page.get_by_role('button',name='次の波へ',exact=True).click()
 page.get_by_text('第2波 · 壁の向こう',exact=True).wait_for()
 assert '1,440' in page.locator('body').inner_text()
 check('endless wave 2 carries accumulated score')
 page.get_by_role('button',name='一時停止',exact=True).click()
 page.get_by_role('button',name='最初から',exact=True).click()
 page.get_by_role('button',name='やり直す',exact=True).click()
 page.get_by_text('第1波 · はじめの連鎖',exact=True).wait_for()
 check('endless restart returns to wave 1')
 page.set_viewport_size({'width':320,'height':568})
 page.wait_for_timeout(300)
 box=page.get_by_role('button',name='発射',exact=True).bounding_box()
 assert box['y']+box['height']<=568
 field=page.get_by_test_id('cascade-field').bounding_box()
 assert field['height']>=160 and field['x']>=0 and field['x']+field['width']<=320
 page.screenshot(path='/tmp/cascade-web-small.png')
 check('320x568 playfield and launch controls fit')
 page.get_by_role('button',name='一時停止',exact=True).click()
 page.get_by_role('switch',name='演出を控えめにする',exact=True).click()
 page.get_by_role('button',name='ステージ選択へ',exact=True).click()
 page.get_by_role('button',name='ステージ選択へ',exact=True).click()
 page.reload(wait_until='networkidle')
 saved=page.evaluate("JSON.parse(localStorage.getItem('@game1000/game008/records/v1'))")
 assert saved['endlessBest']==1440 and saved['endlessWave']==1 and saved['reducedEffects']==True
 check('endless record and reduced effects persist')
 page.goto(os.environ.get('CASCADE_WEB_URL','http://localhost:8100')+'/games',wait_until='networkidle')
 page.get_by_text('NEON CASCADE',exact=True).wait_for()
 check('catalog shows NEON CASCADE')
 assert not errors,errors
 report={'scope':'Chromium touch UI via temporary Expo Web harness; audio muted; native performance not measured','checks':checks,'pageErrors':errors,'storedRecords':saved}
 Path('/tmp/cascade-ui-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report,ensure_ascii=False,indent=2),flush=True)
 browser.close()
